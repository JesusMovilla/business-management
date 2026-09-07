import { AlertTriangle, Info, OctagonAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RentabilidadAlert } from "@/data/repositories/rentabilidad-dashboard-repository";
import { cn } from "@/lib/utils";

const SEVERITY_ICON: Record<
	RentabilidadAlert["severity"],
	typeof AlertTriangle
> = {
	critico: OctagonAlert,
	advertencia: AlertTriangle,
	info: Info,
};

const SEVERITY_CLASSNAME: Record<RentabilidadAlert["severity"], string> = {
	critico: "border-l-destructive text-destructive",
	advertencia: "border-l-(--stock-bajo-fg) text-(--stock-bajo-fg)",
	info: "border-l-border text-muted-foreground",
};

/** Alertas automáticas + recomendación en texto, generadas por reglas simples sobre los datos ya
 * calculados (margen, cobertura, inventario detenido, diferencia de caja) — sin ML, ver plan del
 * módulo sección 6. */
export function AlertsList({ alerts }: { alerts: RentabilidadAlert[] }) {
	if (alerts.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Alertas y recomendaciones</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-sm">
						No se detectaron alertas en este período.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Alertas y recomendaciones ({alerts.length})</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{alerts.map((alert) => {
					const Icon = SEVERITY_ICON[alert.severity];
					return (
						<div
							key={`${alert.title}-${alert.description}`}
							className={cn(
								"flex gap-3 rounded-lg border-l-4 bg-muted/30 p-3",
								SEVERITY_CLASSNAME[alert.severity],
							)}
						>
							<Icon className="mt-0.5 size-4 shrink-0" />
							<div className="flex flex-col gap-0.5">
								<span className="font-medium text-foreground text-sm">
									{alert.title}
								</span>
								<span className="text-muted-foreground text-sm">
									{alert.description}
								</span>
								<span className="text-foreground text-sm">
									{alert.recommendation}
								</span>
							</div>
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}
