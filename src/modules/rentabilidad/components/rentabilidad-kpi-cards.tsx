import {
	Banknote,
	Receipt,
	ShoppingCart,
	Ticket,
	TrendingDown,
	TrendingUp,
	Wallet,
} from "lucide-react";
import { StatTile } from "@/components/ui/stat-tile";
import type { RentabilidadKpis } from "@/data/repositories/rentabilidad-dashboard-repository";
import { formatCurrency, formatPercent } from "@/lib/format";

function comparisonDescription(percent: number | null): string | undefined {
	if (percent === null) return undefined;
	return `${percent >= 0 ? "+" : ""}${formatPercent(percent)} vs. período anterior`;
}

/** Resumen ejecutivo: ventas, costo, ganancia bruta/neta, gastos, dinero recaudado, diferencia de
 * caja, ticket promedio y unidades — todas dependen del período seleccionado. No hay "ventas
 * brutas vs. netas" porque el sistema no registra descuentos ni devoluciones (`notaVentasNetas`). */
export function RentabilidadKpiCards({
	kpis,
	periodLabel,
}: {
	kpis: RentabilidadKpis;
	periodLabel: string;
}) {
	return (
		<div className="flex flex-col gap-2">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				<StatTile
					label={`Ventas (${periodLabel})`}
					value={formatCurrency(kpis.ventas)}
					icon={ShoppingCart}
					description={comparisonDescription(kpis.ventasComparisonPercent)}
				/>
				<StatTile
					label={`Costo de ventas (${periodLabel})`}
					value={formatCurrency(kpis.costoVentas)}
					icon={Receipt}
				/>
				<StatTile
					label={`Ganancia bruta (${periodLabel})`}
					value={formatCurrency(kpis.gananciaBruta)}
					icon={TrendingUp}
					description={
						kpis.margenBrutoPercent === null
							? comparisonDescription(kpis.gananciaBrutaComparisonPercent)
							: `Margen bruto: ${formatPercent(kpis.margenBrutoPercent)}`
					}
					highlight
				/>
				<StatTile
					label={`Gastos operativos (${periodLabel})`}
					value={formatCurrency(kpis.gastosOperativos)}
					icon={TrendingDown}
				/>
				<StatTile
					label={`Ganancia neta (${periodLabel})`}
					value={formatCurrency(kpis.gananciaNeta)}
					icon={Wallet}
					description={comparisonDescription(
						kpis.gananciaNetaComparisonPercent,
					)}
					highlight
				/>
				<StatTile
					label={`Dinero recaudado (${periodLabel})`}
					value={formatCurrency(kpis.dineroRecaudado)}
					icon={Banknote}
					description={
						kpis.diferenciaCaja !== 0
							? `Diferencia de caja: ${formatCurrency(kpis.diferenciaCaja)}`
							: "Sin diferencia de caja"
					}
				/>
				<StatTile
					label={`Ticket promedio (${periodLabel})`}
					value={formatCurrency(kpis.ticketPromedio)}
					icon={Ticket}
					description={`${kpis.numeroCierres} cierre(s) de caja`}
				/>
				<StatTile
					label={`Unidades vendidas (${periodLabel})`}
					value={kpis.unidadesVendidas.toLocaleString("es-CO")}
					icon={ShoppingCart}
				/>
			</div>
			<p className="text-muted-foreground text-xs">{kpis.notaVentasNetas}</p>
		</div>
	);
}
