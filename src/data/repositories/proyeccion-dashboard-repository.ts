import {
	differenceInCalendarDays,
	eachDayOfInterval,
	format,
	parseISO,
	subDays,
} from "date-fns";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { cashClosingItems, cashClosings, products } from "@/db/schema";
import type { DateRange } from "@/modules/proyeccion/period";
import { productRepository } from "./product-repository";
import { profitPayoutRepository } from "./profit-payout-repository";

function toDateOnly(date: Date): string {
	return format(date, "yyyy-MM-dd");
}

function previousPeriod(range: DateRange): DateRange {
	const fromDate = parseISO(range.from);
	const toDate = parseISO(range.to);
	const lengthDays = differenceInCalendarDays(toDate, fromDate) + 1;
	const previousTo = subDays(fromDate, 1);
	const previousFrom = subDays(previousTo, lengthDays - 1);
	return { from: toDateOnly(previousFrom), to: toDateOnly(previousTo) };
}

export interface ProjectionKpis {
	/** Margen potencial si se vende todo el inventario actual a precio de lista — no depende del
	 * período seleccionado, es una foto del inventario de hoy. */
	expectedProfit: number;
	profitInPeriod: number;
	previousPeriodProfit: number;
	comparisonVsPreviousPeriodPercent: number | null;
	paidOutInPeriod: number;
	netAvailableInPeriod: number;
}

export interface ProfitPoint {
	date: string;
	profit: number;
}

export interface ProfitByProduct {
	productId: string;
	name: string;
	profit: number;
}

/**
 * Ganancia real por día en `[from, to]`, uniendo `cash_closing_items` (venta) con `products`
 * (costo actual) — no hay costo histórico por venta, se aproxima con el costo vigente del producto
 * (ver docs/DECISIONS.md). Productos eliminados quedan fuera del join, igual que en
 * `dashboard-repository.getTopProducts`.
 */
async function getDailyProfitRows(
	range: DateRange,
): Promise<{ date: string; profit: number }[]> {
	const rows = await db
		.select({
			date: cashClosings.date,
			profit: sql<number>`coalesce(sum((${cashClosingItems.unitPrice} - ${products.cost}) * ${cashClosingItems.quantitySold}), 0)`,
		})
		.from(cashClosingItems)
		.innerJoin(
			cashClosings,
			eq(cashClosingItems.cashClosingId, cashClosings.id),
		)
		.innerJoin(products, eq(cashClosingItems.productId, products.id))
		.where(
			and(gte(cashClosings.date, range.from), lte(cashClosings.date, range.to)),
		)
		.groupBy(cashClosings.date);
	return rows.map((row) => ({ date: row.date, profit: Number(row.profit) }));
}

export const proyeccionDashboardRepository = {
	async getKpis(range: DateRange): Promise<ProjectionKpis> {
		const previousRange = previousPeriod(range);

		const [currentRows, previousRows, productsWithQty, payouts] =
			await Promise.all([
				getDailyProfitRows(range),
				getDailyProfitRows(previousRange),
				productRepository.listWithQuantity(),
				profitPayoutRepository.list(),
			]);

		const expectedProfit = productsWithQty.reduce((total, product) => {
			const quantity = Math.max(product.stock.quantity, 0);
			return (
				total + quantity * (product.pricing.retailPrice - product.pricing.cost)
			);
		}, 0);

		const profitInPeriod = currentRows.reduce((t, row) => t + row.profit, 0);
		const previousPeriodProfit = previousRows.reduce(
			(t, row) => t + row.profit,
			0,
		);
		const comparisonVsPreviousPeriodPercent =
			previousPeriodProfit > 0
				? ((profitInPeriod - previousPeriodProfit) / previousPeriodProfit) * 100
				: null;

		const paidOutInPeriod = payouts
			.filter(
				(payout) =>
					payout.status !== "anulado" &&
					payout.date >= range.from &&
					payout.date <= range.to,
			)
			.reduce((total, payout) => total + payout.amount, 0);

		return {
			expectedProfit,
			profitInPeriod,
			previousPeriodProfit,
			comparisonVsPreviousPeriodPercent,
			paidOutInPeriod,
			netAvailableInPeriod: profitInPeriod - paidOutInPeriod,
		};
	},

	/** Ganancia real día a día dentro de `range`, con ceros en los días sin ventas. */
	async getProfitTrend(range: DateRange): Promise<ProfitPoint[]> {
		const rows = await getDailyProfitRows(range);
		const profitByDate = new Map(rows.map((row) => [row.date, row.profit]));
		return eachDayOfInterval({
			start: parseISO(range.from),
			end: parseISO(range.to),
		}).map((day) => {
			const date = toDateOnly(day);
			return { date, profit: profitByDate.get(date) ?? 0 };
		});
	},

	/** Top productos por ganancia real dentro de `range`. */
	async getTopProductsByProfit(
		range: DateRange,
		limit = 5,
	): Promise<ProfitByProduct[]> {
		const rows = await db
			.select({
				productId: cashClosingItems.productId,
				name: products.name,
				profit: sql<number>`coalesce(sum((${cashClosingItems.unitPrice} - ${products.cost}) * ${cashClosingItems.quantitySold}), 0)`,
			})
			.from(cashClosingItems)
			.innerJoin(
				cashClosings,
				eq(cashClosingItems.cashClosingId, cashClosings.id),
			)
			.innerJoin(products, eq(cashClosingItems.productId, products.id))
			.where(
				and(
					gte(cashClosings.date, range.from),
					lte(cashClosings.date, range.to),
				),
			)
			.groupBy(cashClosingItems.productId, products.name)
			.orderBy(
				desc(
					sql`sum((${cashClosingItems.unitPrice} - ${products.cost}) * ${cashClosingItems.quantitySold})`,
				),
			)
			.limit(limit);

		return rows.map((row) => ({
			productId: row.productId,
			name: row.name,
			profit: Number(row.profit),
		}));
	},
};
