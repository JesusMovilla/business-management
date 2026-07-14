import { PiggyBank, TrendingUp, Wallet } from "lucide-react";
import { StatTile } from "@/components/ui/stat-tile";
import type { InvestmentKpis } from "@/data/repositories/investment-dashboard-repository";
import { formatCurrency, formatPercent } from "@/lib/format";

export function InvestmentKpiCards({ kpis }: { kpis: InvestmentKpis }) {
	const comparisonDescription =
		kpis.comparisonVsLastMonthPercent === null
			? undefined
			: `${kpis.comparisonVsLastMonthPercent >= 0 ? "+" : ""}${formatPercent(
					kpis.comparisonVsLastMonthPercent,
				)} vs. mes anterior`;

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<StatTile
				label="Invertido hoy"
				value={formatCurrency(kpis.totalToday)}
				icon={Wallet}
			/>
			<StatTile
				label="Invertido este mes"
				value={formatCurrency(kpis.totalThisMonth)}
				icon={TrendingUp}
				description={comparisonDescription}
				highlight
			/>
			<StatTile
				label="Invertido este año"
				value={formatCurrency(kpis.totalThisYear)}
				icon={PiggyBank}
			/>
			<StatTile
				label="Grupo con más inversión (mes)"
				value={kpis.topGroupName ?? "—"}
			/>
		</div>
	);
}
