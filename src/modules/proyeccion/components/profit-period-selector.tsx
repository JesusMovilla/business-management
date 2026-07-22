import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { type DateRange, PERIOD_LABELS, type PeriodKey } from "../period";

const PRESET_KEYS: Exclude<PeriodKey, "custom">[] = [
	"hoy",
	"semana",
	"mes",
	"anio",
];

/**
 * Selector de período para las gráficas y KPIs de Proyección: presets vía `?period=` (Link, sin
 * estado de cliente, igual que `PeriodSelector` de Inicio) y un rango personalizado vía formulario
 * GET nativo (`?period=custom&from=&to=`) — tampoco necesita JavaScript en el cliente.
 */
export function ProfitPeriodSelector({
	activePeriod,
	range,
	includeExpenses,
}: {
	activePeriod: PeriodKey;
	range: DateRange;
	/** Se reenvía como `?gastos=0` en los links/form para no perder el toggle al cambiar de período. */
	includeExpenses: boolean;
}) {
	const gastosSuffix = includeExpenses ? "" : "&gastos=0";
	return (
		<div className="flex flex-wrap items-center gap-2">
			<div className="inline-flex gap-1 rounded-lg border p-1">
				{PRESET_KEYS.map((key) => (
					<Link
						key={key}
						href={`/proyeccion?period=${key}${gastosSuffix}`}
						className={cn(
							"rounded-md px-3 py-1 font-medium text-sm transition-colors",
							activePeriod === key
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:bg-muted",
						)}
					>
						{PERIOD_LABELS[key]}
					</Link>
				))}
			</div>
			<form
				action="/proyeccion"
				className="flex flex-wrap items-end gap-2 rounded-lg border p-1.5"
			>
				<input type="hidden" name="period" value="custom" />
				{!includeExpenses && <input type="hidden" name="gastos" value="0" />}
				<div className="flex flex-col gap-1">
					<Label
						htmlFor="period-from"
						className="px-1 text-muted-foreground text-xs"
					>
						Desde
					</Label>
					<Input
						id="period-from"
						name="from"
						type="date"
						defaultValue={range.from}
						className="h-7"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<Label
						htmlFor="period-to"
						className="px-1 text-muted-foreground text-xs"
					>
						Hasta
					</Label>
					<Input
						id="period-to"
						name="to"
						type="date"
						defaultValue={range.to}
						className="h-7"
					/>
				</div>
				<Button
					type="submit"
					size="sm"
					variant={activePeriod === "custom" ? "default" : "outline"}
				>
					Personalizado
				</Button>
			</form>
		</div>
	);
}
