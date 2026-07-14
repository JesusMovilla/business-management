import nextDynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { investmentDashboardRepository } from "@/data/repositories/investment-dashboard-repository";
import { investmentGroupRepository } from "@/data/repositories/investment-group-repository";
import { investmentRepository } from "@/data/repositories/investment-repository";
import { InvestmentKpiCards } from "@/modules/inversion/components/investment-kpi-cards";
import { InvestmentTable } from "@/modules/inversion/components/investment-table";

// Recharts es pesado — se separa en su propio chunk (mismo criterio que /inicio y /gastos).
const ChartSkeleton = <Skeleton className="aspect-auto h-64 w-full" />;
const InvestmentGroupChart = nextDynamic(
	() =>
		import("@/modules/inversion/components/investment-group-chart").then(
			(mod) => mod.InvestmentGroupChart,
		),
	{ loading: () => ChartSkeleton },
);
const InvestmentMonthlyTrendChart = nextDynamic(
	() =>
		import(
			"@/modules/inversion/components/investment-monthly-trend-chart"
		).then((mod) => mod.InvestmentMonthlyTrendChart),
	{ loading: () => ChartSkeleton },
);

// Las inversiones viven en Postgres real, no en un snapshot estático: renderizar por request.
export const dynamic = "force-dynamic";

export default async function InversionPage() {
	const [kpis, groupBreakdown, monthlyTrend, investments, groups] =
		await Promise.all([
			investmentDashboardRepository.getKpis(),
			investmentDashboardRepository.getGroupBreakdown(),
			investmentDashboardRepository.getMonthlyTrend(),
			investmentRepository.list(),
			investmentGroupRepository.list(),
		]);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">Control de inversión</h1>
					<p className="text-muted-foreground text-sm">
						Registro de inversiones por grupo.
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" render={<Link href="/inversion/grupos" />}>
						Grupos
					</Button>
				</div>
			</div>

			<InvestmentKpiCards kpis={kpis} />

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Inversión por grupo (mes actual)</CardTitle>
					</CardHeader>
					<CardContent>
						<InvestmentGroupChart
							data={groupBreakdown.map((row) => ({
								id: row.groupId,
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
						<InvestmentMonthlyTrendChart data={monthlyTrend} />
					</CardContent>
				</Card>
			</div>

			<InvestmentTable initialInvestments={investments} groups={groups} />
		</div>
	);
}
