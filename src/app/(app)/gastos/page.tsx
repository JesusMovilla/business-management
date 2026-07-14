import nextDynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { expenseCategoryRepository } from "@/data/repositories/expense-category-repository";
import { expenseDashboardRepository } from "@/data/repositories/expense-dashboard-repository";
import { expenseRepository } from "@/data/repositories/expense-repository";
import { ExpenseKpiCards } from "@/modules/gastos/components/expense-kpi-cards";
import { ExpenseTable } from "@/modules/gastos/components/expense-table";

// Recharts es pesado — se separa en su propio chunk (mismo criterio que /inicio).
const ChartSkeleton = <Skeleton className="aspect-auto h-64 w-full" />;
const ExpenseCategoryChart = nextDynamic(
	() =>
		import("@/modules/gastos/components/expense-category-chart").then(
			(mod) => mod.ExpenseCategoryChart,
		),
	{ loading: () => ChartSkeleton },
);
const ExpenseMonthlyTrendChart = nextDynamic(
	() =>
		import("@/modules/gastos/components/expense-monthly-trend-chart").then(
			(mod) => mod.ExpenseMonthlyTrendChart,
		),
	{ loading: () => ChartSkeleton },
);

// Los gastos viven en Postgres real, no en un snapshot estático: renderizar por request.
export const dynamic = "force-dynamic";

export default async function GastosPage() {
	const [kpis, categoryBreakdown, monthlyTrend, expenses, categories] =
		await Promise.all([
			expenseDashboardRepository.getKpis(),
			expenseDashboardRepository.getCategoryBreakdown(),
			expenseDashboardRepository.getMonthlyTrend(),
			expenseRepository.list(),
			expenseCategoryRepository.list(),
		]);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">Control de gastos</h1>
					<p className="text-muted-foreground text-sm">
						Registro y categorías de los gastos del negocio.
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" render={<Link href="/gastos/categorias" />}>
						Categorías
					</Button>
				</div>
			</div>

			<ExpenseKpiCards kpis={kpis} />

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Gastos por categoría (mes actual)</CardTitle>
					</CardHeader>
					<CardContent>
						<ExpenseCategoryChart
							data={categoryBreakdown.map((row) => ({
								id: row.categoryId,
								label: row.name,
								value: row.total,
							}))}
						/>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Evolución mensual</CardTitle>
					</CardHeader>
					<CardContent>
						<ExpenseMonthlyTrendChart data={monthlyTrend} />
					</CardContent>
				</Card>
			</div>

			<ExpenseTable initialExpenses={expenses} categories={categories} />
		</div>
	);
}
