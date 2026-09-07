import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ProfitBridgeStep {
	label: string;
	value: number;
	isTotal?: boolean;
}

/**
 * Puente de rentabilidad (versión sin descuentos ni devoluciones, que no existen en el sistema):
 * Ventas → Costo de productos → Ganancia bruta → Gastos → Ganancia neta. Se muestra como barras
 * horizontales proporcionales en vez de un waterfall de recharts — más simple y suficiente para
 * cinco pasos.
 */
export function ProfitBridge({
	ventas,
	costoVentas,
	gananciaBruta,
	gastos,
	gananciaNeta,
}: {
	ventas: number;
	costoVentas: number;
	gananciaBruta: number;
	gastos: number;
	gananciaNeta: number;
}) {
	const steps: ProfitBridgeStep[] = [
		{ label: "Ventas", value: ventas, isTotal: true },
		{ label: "− Costo de productos", value: -costoVentas },
		{ label: "= Ganancia bruta", value: gananciaBruta, isTotal: true },
		{ label: "− Gastos operativos", value: -gastos },
		{ label: "= Ganancia neta", value: gananciaNeta, isTotal: true },
	];
	const maxAbs = Math.max(ventas, gananciaBruta, gananciaNeta, 1);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Puente de rentabilidad</CardTitle>
				<p className="text-muted-foreground text-sm">
					Sin descuentos ni devoluciones: el sistema no los registra todavía.
				</p>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{steps.map((step) => {
					const width = Math.min((Math.abs(step.value) / maxAbs) * 100, 100);
					const negative = step.value < 0;
					return (
						<div key={step.label} className="flex flex-col gap-1">
							<div className="flex items-center justify-between text-sm">
								<span
									className={cn(
										step.isTotal ? "font-medium" : "text-muted-foreground",
									)}
								>
									{step.label}
								</span>
								<span
									className={cn(
										"tabular-nums",
										step.isTotal ? "font-semibold" : "text-muted-foreground",
										negative && "text-destructive",
									)}
								>
									{negative ? "−" : ""}
									{formatCurrency(Math.abs(step.value))}
								</span>
							</div>
							<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
								<div
									className={cn(
										"h-full rounded-full",
										negative ? "bg-destructive" : "bg-primary",
									)}
									style={{ width: `${width}%` }}
								/>
							</div>
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}
