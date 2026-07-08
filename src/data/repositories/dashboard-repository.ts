import { eachDayOfInterval, format, startOfMonth, subDays } from "date-fns";
import { desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { cashClosingItems, cashClosings, products } from "@/db/schema";
import type {
	CategoryStock,
	DashboardKpis,
	ReconciliationBreakdown,
	RevenuePoint,
	TopProduct,
	TopSalesDay,
} from "@/types";
import { categoryRepository } from "./category-repository";
import { productRepository } from "./product-repository";

function toDateOnly(date: Date): string {
	return format(date, "yyyy-MM-dd");
}

export const dashboardRepository = {
	async getKpis(): Promise<DashboardKpis> {
		const monthStart = toDateOnly(startOfMonth(new Date()));

		const [[revenueRow], [unitsRow], productsWithQty] = await Promise.all([
			db
				.select({
					revenue: sql<number>`coalesce(sum(${cashClosings.expectedIncome}), 0)`,
				})
				.from(cashClosings)
				.where(gte(cashClosings.date, monthStart)),
			db
				.select({
					units: sql<number>`coalesce(sum(${cashClosingItems.quantitySold}), 0)`,
				})
				.from(cashClosingItems)
				.innerJoin(
					cashClosings,
					eq(cashClosingItems.cashClosingId, cashClosings.id),
				)
				.where(gte(cashClosings.date, monthStart)),
			productRepository.listWithQuantity(),
		]);

		let lowStockCount = 0;
		let criticalStockCount = 0;
		let inventoryValue = 0;
		for (const product of productsWithQty) {
			const quantity = product.stock.quantity;
			inventoryValue += Math.max(quantity, 0) * product.pricing.cost;
			if (quantity <= 0) criticalStockCount++;
			else if (quantity <= product.stock.minStock) lowStockCount++;
		}

		return {
			revenueThisMonth: Number(revenueRow?.revenue ?? 0),
			unitsSoldThisMonth: Number(unitsRow?.units ?? 0),
			lowStockCount,
			criticalStockCount,
			inventoryValue,
		};
	},

	/** Ingreso esperado por día en los últimos `days` días, con ceros en los días sin cierre. */
	async getRevenueTrend(days: number): Promise<RevenuePoint[]> {
		const rangeStart = subDays(new Date(), days - 1);
		const since = toDateOnly(rangeStart);
		const rows = await db
			.select({
				date: cashClosings.date,
				income: sql<number>`coalesce(sum(${cashClosings.expectedIncome}), 0)`,
			})
			.from(cashClosings)
			.where(gte(cashClosings.date, since))
			.groupBy(cashClosings.date);

		const incomeByDate = new Map(
			rows.map((row) => [row.date, Number(row.income)]),
		);
		return eachDayOfInterval({ start: rangeStart, end: new Date() }).map(
			(day) => {
				const date = toDateOnly(day);
				return { date, income: incomeByDate.get(date) ?? 0 };
			},
		);
	},

	/** Top productos por unidades vendidas en los últimos `days` días. */
	async getTopProducts(days: number, limit = 5): Promise<TopProduct[]> {
		const since = toDateOnly(subDays(new Date(), days - 1));
		const rows = await db
			.select({
				productId: cashClosingItems.productId,
				quantitySold: sql<number>`coalesce(sum(${cashClosingItems.quantitySold}), 0)`,
			})
			.from(cashClosingItems)
			.innerJoin(
				cashClosings,
				eq(cashClosingItems.cashClosingId, cashClosings.id),
			)
			.where(gte(cashClosings.date, since))
			.groupBy(cashClosingItems.productId)
			.orderBy(desc(sql`sum(${cashClosingItems.quantitySold})`))
			.limit(limit);

		if (rows.length === 0) return [];
		const productRows = await db
			.select({ id: products.id, name: products.name })
			.from(products);
		const nameById = new Map(productRows.map((row) => [row.id, row.name]));

		return rows.map((row) => ({
			productId: row.productId,
			name: nameById.get(row.productId) ?? "Producto eliminado",
			quantitySold: Number(row.quantitySold),
		}));
	},

	/** Cuenta de cierres por estado de conciliación en los últimos `days` días. */
	async getReconciliationBreakdown(
		days: number,
	): Promise<ReconciliationBreakdown> {
		const since = toDateOnly(subDays(new Date(), days - 1));
		const rows = await db
			.select({ difference: cashClosings.difference })
			.from(cashClosings)
			.where(gte(cashClosings.date, since));

		return rows.reduce<ReconciliationBreakdown>(
			(acc, row) => {
				if (row.difference > 0) acc.sobrante++;
				else if (row.difference < 0) acc.faltante++;
				else acc.ok++;
				return acc;
			},
			{ ok: 0, sobrante: 0, faltante: 0 },
		);
	},

	/** Unidades en stock (nunca negativas) agrupadas por categoría. */
	async getStockByCategory(): Promise<CategoryStock[]> {
		const [productsWithQty, categoryList] = await Promise.all([
			productRepository.listWithQuantity(),
			categoryRepository.list(),
		]);

		const quantityByCategory = new Map<string, number>();
		for (const product of productsWithQty) {
			const current = quantityByCategory.get(product.categoryId) ?? 0;
			quantityByCategory.set(
				product.categoryId,
				current + Math.max(product.stock.quantity, 0),
			);
		}

		return categoryList.map((category) => ({
			categoryId: category.id,
			categoryName: category.name,
			quantity: quantityByCategory.get(category.id) ?? 0,
		}));
	},

	/** El cierre de caja con mayor ingreso esperado registrado (histórico). */
	async getTopSalesDay(): Promise<TopSalesDay | null> {
		const [row] = await db
			.select({
				id: cashClosings.id,
				date: cashClosings.date,
				expectedIncome: cashClosings.expectedIncome,
			})
			.from(cashClosings)
			.orderBy(desc(cashClosings.expectedIncome))
			.limit(1);

		return row
			? {
					closingId: row.id,
					date: row.date,
					expectedIncome: row.expectedIncome,
				}
			: null;
	},
};
