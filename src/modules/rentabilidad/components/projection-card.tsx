import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectionResult } from "@/data/repositories/rentabilidad-dashboard-repository";
import { formatCurrency } from "@/lib/format";

/**
 * Proyección con el inventario actual — tres niveles, según el plan del módulo sección 7:
 * potencial máximo teórico (todo se vende a precio de lista), proyección realista (según
 * sell-through histórico de los últimos 30 días) y una tendencia simple de ventas/ganancia futuras
 * por promedio diario del período seleccionado, proyectado a la misma duración. Se muestra como
 * estimado, no como ganancia asegurada.
 */
export function ProjectionCard({
	projection,
}: {
	projection: ProjectionResult;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Proyección con el inventario actual</CardTitle>
				<p className="text-muted-foreground text-sm">
					Estimado, no garantizado — basado en {projection.diasHistorialUsados}{" "}
					día(s) con datos en el período seleccionado.
				</p>
			</CardHeader>
			<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div className="flex flex-col gap-1 rounded-lg border p-3">
					<span className="text-muted-foreground text-xs">
						Potencial máximo teórico
					</span>
					<span className="font-semibold text-lg tabular-nums">
						{formatCurrency(projection.potencialMaximoGanancia)}
					</span>
					<span className="text-muted-foreground text-xs">
						Ingresos: {formatCurrency(projection.potencialMaximoIngresos)} — si
						se vende todo el inventario al precio actual, sin devoluciones ni
						pérdidas.
					</span>
				</div>
				<div className="flex flex-col gap-1 rounded-lg border p-3">
					<span className="text-muted-foreground text-xs">
						Proyección realista de inventario
					</span>
					<span className="font-semibold text-lg tabular-nums">
						{formatCurrency(projection.proyeccionRealistaGanancia)}
					</span>
					<span className="text-muted-foreground text-xs">
						≈ {Math.round(projection.proyeccionRealistaUnidades)} unidades,
						según sell-through de los últimos 30 días por producto.
					</span>
				</div>
				<div className="flex flex-col gap-1 rounded-lg border p-3">
					<span className="text-muted-foreground text-xs">
						Tendencia de venta/ganancia proyectada ({projection.diasProyectados}{" "}
						día(s))
					</span>
					<span className="font-semibold text-lg tabular-nums">
						{formatCurrency(projection.tendenciaGananciaProyectada)}
					</span>
					<span className="text-muted-foreground text-xs">
						Ventas: {formatCurrency(projection.tendenciaVentasProyectadas)} —
						promedio diario del período seleccionado, sin estacionalidad ni
						escenarios.
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
