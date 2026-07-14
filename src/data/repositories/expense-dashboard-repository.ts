import { format, startOfMonth, subMonths } from "date-fns";
import { dashboardRepository } from "@/data/repositories/dashboard-repository";
import { expenseCategoryRepository } from "@/data/repositories/expense-category-repository";
import { expenseRepository } from "@/data/repositories/expense-repository";
import type { Expense } from "@/types";

function toDateOnly(date: Date): string {
	return format(date, "yyyy-MM-dd");
}

function sum(rows: Expense[]): number {
	return rows.reduce((total, row) => total + row.amount, 0);
}

export interface ExpenseKpis {
	totalToday: number;
	totalThisMonth: number;
	totalThisYear: number;
	previousMonthTotal: number;
	comparisonVsLastMonthPercent: number | null;
	topCategoryName: string | null;
	topSupplierName: string | null;
	expenseToRevenuePercent: number | null;
}

export interface ExpenseCategoryTotal {
	categoryId: string;
	name: string;
	total: number;
}

export interface ExpenseMonthlyTotal {
	month: string;
	total: number;
}

/**
 * Agregaciones de Gastos para el dashboard, en el mismo espíritu que `dashboard-repository.ts`:
 * el volumen de datos de un solo negocio no justifica más que traer los gastos y reducir en JS.
 */
export const expenseDashboardRepository = {
	async getKpis(): Promise<ExpenseKpis> {
		const now = new Date();
		const today = toDateOnly(now);
		const monthStart = toDateOnly(startOfMonth(now));
		const previousMonthStart = toDateOnly(startOfMonth(subMonths(now, 1)));
		const yearStart = `${now.getFullYear()}-01-01`;

		const [allExpenses, categories, revenueKpis] = await Promise.all([
			expenseRepository.list(),
			expenseCategoryRepository.list(),
			dashboardRepository.getKpis(),
		]);

		const active = allExpenses.filter(
			(expense) => expense.status !== "anulado",
		);

		const totalToday = sum(active.filter((e) => e.date === today));
		const totalThisMonth = sum(active.filter((e) => e.date >= monthStart));
		const totalThisYear = sum(active.filter((e) => e.date >= yearStart));
		const previousMonthTotal = sum(
			active.filter((e) => e.date >= previousMonthStart && e.date < monthStart),
		);
		const comparisonVsLastMonthPercent =
			previousMonthTotal > 0
				? ((totalThisMonth - previousMonthTotal) / previousMonthTotal) * 100
				: null;

		const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
		const totalsByCategory = new Map<string, number>();
		const totalsBySupplier = new Map<string, number>();
		for (const expense of active.filter((e) => e.date >= monthStart)) {
			totalsByCategory.set(
				expense.categoryId,
				(totalsByCategory.get(expense.categoryId) ?? 0) + expense.amount,
			);
			if (expense.supplier) {
				totalsBySupplier.set(
					expense.supplier,
					(totalsBySupplier.get(expense.supplier) ?? 0) + expense.amount,
				);
			}
		}
		const topCategoryEntry = [...totalsByCategory.entries()].sort(
			(a, b) => b[1] - a[1],
		)[0];
		const topSupplierEntry = [...totalsBySupplier.entries()].sort(
			(a, b) => b[1] - a[1],
		)[0];

		const expenseToRevenuePercent =
			revenueKpis.revenueThisMonth > 0
				? (totalThisMonth / revenueKpis.revenueThisMonth) * 100
				: null;

		return {
			totalToday,
			totalThisMonth,
			totalThisYear,
			previousMonthTotal,
			comparisonVsLastMonthPercent,
			topCategoryName: topCategoryEntry
				? (categoryNameById.get(topCategoryEntry[0]) ?? null)
				: null,
			topSupplierName: topSupplierEntry ? topSupplierEntry[0] : null,
			expenseToRevenuePercent,
		};
	},

	/** Gasto por categoría del mes actual, de mayor a menor. */
	async getCategoryBreakdown(): Promise<ExpenseCategoryTotal[]> {
		const monthStart = toDateOnly(startOfMonth(new Date()));
		const [allExpenses, categories] = await Promise.all([
			expenseRepository.list(),
			expenseCategoryRepository.list(),
		]);
		const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
		const totals = new Map<string, number>();
		for (const expense of allExpenses) {
			if (expense.status === "anulado" || expense.date < monthStart) continue;
			totals.set(
				expense.categoryId,
				(totals.get(expense.categoryId) ?? 0) + expense.amount,
			);
		}
		return [...totals.entries()]
			.map(([categoryId, total]) => ({
				categoryId,
				name: categoryNameById.get(categoryId) ?? "Sin categoría",
				total,
			}))
			.sort((a, b) => b.total - a.total);
	},

	/** Gasto total mes a mes, últimos `months` meses (incluido el actual). */
	async getMonthlyTrend(months = 6): Promise<ExpenseMonthlyTotal[]> {
		const allExpenses = await expenseRepository.list();
		const active = allExpenses.filter((e) => e.status !== "anulado");
		const result: ExpenseMonthlyTotal[] = [];
		for (let i = months - 1; i >= 0; i--) {
			const monthKey = format(subMonths(new Date(), i), "yyyy-MM");
			const total = sum(active.filter((e) => e.date.startsWith(monthKey)));
			result.push({ month: monthKey, total });
		}
		return result;
	},
};
