import nextDynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { investmentGroupRepository } from "@/data/repositories/investment-group-repository";
import { profitPayoutRepository } from "@/data/repositories/profit-payout-repository";
import { proyeccionDashboardRepository } from "@/data/repositories/proyeccion-dashboard-repository";
import { IncludeExpensesToggle } from "@/modules/proyeccion/components/include-expenses-toggle";
import { ProfitKpiCards } from "@/modules/proyeccion/components/profit-kpi-cards";
import { ProfitPayoutTable } from "@/modules/proyeccion/components/profit-payout-table";
import { ProfitPeriodSelector } from "@/modules/proyeccion/components/profit-period-selector";
import {
	formatPeriodLabel,
	resolveIncludeExpenses,
	resolvePeriod,
} from "@/modules/proyeccion/period";

// Recharts es pesado — se separa en su propio chunk (mismo criterio que /inicio y /inversion).
const ChartSkeleton = <Skeleton className="aspect-auto h-64 w-full" />;
const ProfitTrendChart = nextDynamic(
	() =>
		import("@/modules/proyeccion/components/profit-trend-chart").then(
			(mod) => mod.ProfitTrendChart,
		),
	{ loading: () => ChartSkeleton },
);
const ProfitByProductChart = nextDynamic(
	() =>
		import("@/modules/proyeccion/components/profit-by-product-chart").then(
			(mod) => mod.ProfitByProductChart,
		),
	{ loading: () => ChartSkeleton },
);

// La ganancia real depende de Cierre de caja e Inventario en Postgres: renderizar por request.
export const dynamic = "force-dynamic";

export default async function ProyeccionPage({
	searchParams,
}: {
	searchParams: Promise<{
		period?: string;
		from?: string;
		to?: string;
		gastos?: string;
	}>;
}) {
	const params = await searchParams;
	const { period, range } = resolvePeriod(params);
	const periodLabel = formatPeriodLabel(period, range);
	const includeExpenses = resolveIncludeExpenses(params);

	const [kpis, profitTrend, topProducts, payouts, groups] = await Promise.all([
		proyeccionDashboardRepository.getKpis(range, includeExpenses),
		proyeccionDashboardRepository.getProfitTrend(range, includeExpenses),
		proyeccionDashboardRepository.getTopProductsByProfit(range),
		profitPayoutRepository.list(),
		investmentGroupRepository.list(),
	]);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">Proyección de ganancias</h1>
					<p className="text-muted-foreground text-sm">
						Ganancia esperada del inventario, ganancia real a la fecha y pagos a
						grupos de socios.
					</p>
				</div>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-3">
				<ProfitPeriodSelector
					activePeriod={period}
					range={range}
					includeExpenses={includeExpenses}
				/>
				<IncludeExpensesToggle checked={includeExpenses} />
			</div>

			<ProfitKpiCards kpis={kpis} periodLabel={periodLabel} />

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>
							Evolución de la ganancia {includeExpenses ? "neta" : "real"} (
							{periodLabel})
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ProfitTrendChart data={profitTrend} />
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Producto con más ganancia ({periodLabel})</CardTitle>
					</CardHeader>
					<CardContent>
						<ProfitByProductChart
							data={topProducts.map((row) => ({
								id: row.productId,
								label: row.name,
								value: row.profit,
							}))}
						/>
					</CardContent>
				</Card>
			</div>

			<ProfitPayoutTable initialPayouts={payouts} groups={groups} />
		</div>
	);
}
