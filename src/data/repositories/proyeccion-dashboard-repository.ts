import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { cashClosingItems, cashClosings, products } from "@/db/schema";
import type { DateRange } from "@/modules/proyeccion/period";
import { expenseRepository } from "./expense-repository";
import { productRepository } from "./product-repository";
import { profitPayoutRepository } from "./profit-payout-repository";

type Expense = Awaited<ReturnType<typeof expenseRepository.list>>[number];

function toDateOnly(date: Date): string {
	return format(date, "yyyy-MM-dd");
}

/** Gastos no anulados de `expenses` agrupados por día dentro de `range`, para netear la ganancia
 * real día a día — a diferencia de `paidOutInPeriod`, cada gasto se atribuye a su propio `date`
 * en vez de sumarse solo en el total del período. */
function expensesByDay(
	expenses: Expense[],
	range: DateRange,
): Map<string, number> {
	const map = new Map<string, number>();
	for (const expense of expenses) {
		if (expense.status === "anulado") continue;
		if (expense.date < range.from || expense.date > range.to) continue;
		map.set(expense.date, (map.get(expense.date) ?? 0) + expense.amount);
	}
	return map;
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
	/** Suma de gastos no anulados del período — se muestra siempre, se resta de la neta solo si
	 * `includeExpenses` es `true`. */
	expensesInPeriod: number;
	includeExpenses: boolean;
	netAvailableInPeriod: number;
}

export interface ProfitPoint {
	date: string;
	/** Ganancia bruta del día menos gastos del mismo día, si `includeExpenses` está activo — puede
	 * ser negativa (día en pérdida). */
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
	async getKpis(
		range: DateRange,
		includeExpenses = true,
	): Promise<ProjectionKpis> {
		const previousRange = previousPeriod(range);

		const [currentRows, previousRows, productsWithQty, payouts, expenses] =
			await Promise.all([
				getDailyProfitRows(range),
				getDailyProfitRows(previousRange),
				productRepository.listWithQuantity(),
				profitPayoutRepository.list(),
				expenseRepository.list(),
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

		const expensesInPeriod = Array.from(
			expensesByDay(expenses, range).values(),
		).reduce((total, amount) => total + amount, 0);

		return {
			expectedProfit,
			profitInPeriod,
			previousPeriodProfit,
			comparisonVsPreviousPeriodPercent,
			paidOutInPeriod,
			expensesInPeriod,
			includeExpenses,
			netAvailableInPeriod:
				profitInPeriod -
				paidOutInPeriod -
				(includeExpenses ? expensesInPeriod : 0),
		};
	},

	/** Ganancia neta por día dentro de `range` (venta menos gastos del mismo día si
	 * `includeExpenses` está activo) — solo incluye días con al menos una venta o un gasto, no
	 * todos los días del rango. */
	async getProfitTrend(
		range: DateRange,
		includeExpenses = true,
	): Promise<ProfitPoint[]> {
		const [rows, expenses] = await Promise.all([
			getDailyProfitRows(range),
			includeExpenses ? expenseRepository.list() : Promise.resolve([]),
		]);
		const profitByDate = new Map(rows.map((row) => [row.date, row.profit]));
		const expensesByDate = expensesByDay(expenses, range);
		const dates = new Set([...profitByDate.keys(), ...expensesByDate.keys()]);
		return Array.from(dates)
			.sort()
			.map((date) => {
				const grossProfit = profitByDate.get(date) ?? 0;
				const dayExpenses = expensesByDate.get(date) ?? 0;
				return { date, profit: grossProfit - dayExpenses };
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
