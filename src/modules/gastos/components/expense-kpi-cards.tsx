import { PiggyBank, Receipt, TrendingDown, TrendingUp } from "lucide-react";
import { StatTile } from "@/components/ui/stat-tile";
import type { ExpenseKpis } from "@/data/repositories/expense-dashboard-repository";
import { formatCurrency, formatPercent } from "@/lib/format";

export function ExpenseKpiCards({ kpis }: { kpis: ExpenseKpis }) {
	const comparisonDescription =
		kpis.comparisonVsLastMonthPercent === null
			? undefined
			: `${kpis.comparisonVsLastMonthPercent >= 0 ? "+" : ""}${formatPercent(
					kpis.comparisonVsLastMonthPercent,
				)} vs. mes anterior`;

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<StatTile
				label="Gastado hoy"
				value={formatCurrency(kpis.totalToday)}
				icon={Receipt}
			/>
			<StatTile
				label="Gastado este mes"
				value={formatCurrency(kpis.totalThisMonth)}
				icon={TrendingUp}
				description={comparisonDescription}
				tone={
					kpis.comparisonVsLastMonthPercent !== null &&
					kpis.comparisonVsLastMonthPercent > 0
						? "warning"
						: "default"
				}
				highlight
			/>
			<StatTile
				label="Gastado este año"
				value={formatCurrency(kpis.totalThisYear)}
				icon={PiggyBank}
			/>
			<StatTile
				label="% gastos sobre ingresos (mes)"
				value={
					kpis.expenseToRevenuePercent === null
						? "—"
						: formatPercent(kpis.expenseToRevenuePercent)
				}
				icon={TrendingDown}
				description={
					kpis.topCategoryName
						? `Top categoría: ${kpis.topCategoryName}`
						: undefined
				}
			/>
		</div>
	);
}
