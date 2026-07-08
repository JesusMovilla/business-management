import Link from "next/link";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS = [
	{ days: 7, label: "7 días" },
	{ days: 30, label: "30 días" },
	{ days: 90, label: "90 días" },
];

/** Selector de rango de fechas para las gráficas de Inicio, vía `?range=` (sin estado de cliente). */
export function PeriodSelector({ activeDays }: { activeDays: number }) {
	return (
		<div className="inline-flex gap-1 rounded-lg border p-1">
			{RANGE_OPTIONS.map((option) => (
				<Link
					key={option.days}
					href={`/inicio?range=${option.days}`}
					className={cn(
						"rounded-md px-3 py-1 font-medium text-sm transition-colors",
						option.days === activeDays
							? "bg-primary text-primary-foreground"
							: "text-muted-foreground hover:bg-muted",
					)}
				>
					{option.label}
				</Link>
			))}
		</div>
	);
}
