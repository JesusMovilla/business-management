import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BreakEvenResult } from "@/data/repositories/rentabilidad-dashboard-repository";
import { formatCurrency, formatPercent } from "@/lib/format";

/** Punto de equilibrio = gastos fijos del período ÷ margen de contribución promedio — viable
 * porque `expenses.type === "fijo"` ya distingue gastos fijos de variables (sección 8 del plan). */
export function BreakEvenCard({ breakEven }: { breakEven: BreakEvenResult }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Punto de equilibrio</CardTitle>
			</CardHeader>
			<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div className="flex flex-col gap-1">
					<span className="text-muted-foreground text-xs">
						Gastos fijos del período
					</span>
					<span className="font-semibold text-lg tabular-nums">
						{formatCurrency(breakEven.gastosFijos)}
					</span>
				</div>
				<div className="flex flex-col gap-1">
					<span className="text-muted-foreground text-xs">
						Margen de contribución promedio
					</span>
					<span className="font-semibold text-lg tabular-nums">
						{breakEven.margenContribucionPromedioPercent === null
							? "—"
							: formatPercent(breakEven.margenContribucionPromedioPercent)}
					</span>
				</div>
				<div className="flex flex-col gap-1">
					<span className="text-muted-foreground text-xs">
						Ventas necesarias para cubrir gastos fijos
					</span>
					<span className="font-semibold text-lg tabular-nums">
						{breakEven.ventasParaEquilibrio === null
							? "No calculable (sin margen positivo)"
							: formatCurrency(breakEven.ventasParaEquilibrio)}
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
