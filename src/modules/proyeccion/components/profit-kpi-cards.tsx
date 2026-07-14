import { HandCoins, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import { StatTile } from "@/components/ui/stat-tile";
import type { ProjectionKpis } from "@/data/repositories/proyeccion-dashboard-repository";
import { formatCurrency, formatPercent } from "@/lib/format";

/** KPIs de Proyección: `expectedProfit` es una foto del inventario actual, ajena al período; el
 * resto respeta el período elegido en `ProfitPeriodSelector` (`periodLabel` ya viene formateado). */
export function ProfitKpiCards({
  kpis,
  periodLabel,
}: {
  kpis: ProjectionKpis;
  periodLabel: string;
}) {
  const comparisonDescription =
    kpis.comparisonVsPreviousPeriodPercent === null
      ? undefined
      : `${kpis.comparisonVsPreviousPeriodPercent >= 0 ? "+" : ""}${formatPercent(
          kpis.comparisonVsPreviousPeriodPercent,
        )} vs. período anterior`;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile
        label="Ganancia esperada"
        value={formatCurrency(kpis.expectedProfit)}
        icon={PiggyBank}
        // description="Si se vende todo el inventario a precio de lista"
      />
      <StatTile
        label={`Ganancia real (${periodLabel})`}
        value={formatCurrency(kpis.profitInPeriod)}
        icon={TrendingUp}
        description={comparisonDescription}
        highlight
      />
      <StatTile
        label={`Pagado a grupos (${periodLabel})`}
        value={formatCurrency(kpis.paidOutInPeriod)}
        icon={HandCoins}
      />
      <StatTile
        label={`Ganancia neta (${periodLabel})`}
        value={formatCurrency(kpis.netAvailableInPeriod)}
        icon={Wallet}
        // description="Ganancia real del período menos lo ya pagado"
      />
    </div>
  );
}
