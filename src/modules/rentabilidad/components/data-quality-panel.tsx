import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DataQualityResult } from "@/data/repositories/rentabilidad-dashboard-repository";
import { formatPercent } from "@/lib/format";

/** Panel de calidad de datos (sección 9 del plan): evita mostrar cifras de ganancia "exactas"
 * cuando la información de base está incompleta. */
export function DataQualityPanel({ quality }: { quality: DataQualityResult }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Calidad de datos</CardTitle>
			</CardHeader>
			<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div className="flex flex-col gap-1">
					<span className="text-muted-foreground text-xs">
						Productos con costo válido
					</span>
					<span className="font-semibold text-lg tabular-nums">
						{formatPercent(quality.productosConCostoValidoPercent)}
					</span>
				</div>
				<div className="flex flex-col gap-1">
					<span className="text-muted-foreground text-xs">
						Ventas con costo histórico (no aproximado)
					</span>
					<span className="font-semibold text-lg tabular-nums">
						{formatPercent(quality.ventasConCostoSnapshotPercent)}
					</span>
				</div>
				<div className="flex flex-col gap-1">
					<span className="text-muted-foreground text-xs">
						Gastos con categoría
					</span>
					<span className="font-semibold text-lg tabular-nums">
						{formatPercent(quality.gastosConCategoriaPercent)}
					</span>
				</div>
				<div className="flex flex-col gap-1">
					<span className="text-muted-foreground text-xs">
						Cierres de caja con diferencia sin resolver
					</span>
					<span className="font-semibold text-lg tabular-nums">
						{quality.cierresConDiferenciaSinResolver}
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
