import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatTileProps {
	label: string;
	value: ReactNode;
	icon?: LucideIcon;
	description?: string;
	/** Si se pasa, la tarjeta completa es un link (ej. "Stock bajo" → /inventario/alertas). */
	href?: string;
	/** Tiñe el valor con los mismos colores semánticos de estado de stock. */
	tone?: "default" | "warning" | "critical";
}

const TONE_CLASSNAME: Record<NonNullable<StatTileProps["tone"]>, string> = {
	default: "text-foreground",
	warning: "text-(--stock-bajo-fg)",
	critical: "text-(--stock-critico-fg)",
};

/**
 * Tarjeta de KPI: un número grande con su etiqueta, para filas de estadísticas (ej. `/inicio`).
 * `tone` tiñe el valor con los colores semánticos de estado de stock (warning/critical) para
 * alertas; `href` vuelve toda la tarjeta clickeable.
 *
 * Ejemplo:
 * ```tsx
 * <StatTile label="Stock bajo" value={3} tone="warning" href="/inventario/alertas" icon={AlertTriangle} />
 * ```
 */
export function StatTile({
	label,
	value,
	icon: Icon,
	description,
	href,
	tone = "default",
}: StatTileProps) {
	const content = (
		<Card className={cn(href && "transition-colors hover:bg-muted/50")}>
			<CardContent className="flex items-start justify-between gap-3">
				<div className="flex flex-col gap-1">
					<span className="text-muted-foreground text-sm">{label}</span>
					<span
						className={cn(
							"font-semibold text-2xl tabular-nums",
							TONE_CLASSNAME[tone],
						)}
					>
						{value}
					</span>
					{description && (
						<span className="text-muted-foreground text-xs">{description}</span>
					)}
				</div>
				{Icon && (
					<div className="rounded-lg bg-muted p-2 text-muted-foreground">
						<Icon className="size-4" />
					</div>
				)}
			</CardContent>
		</Card>
	);

	if (!href) return content;
	return (
		<Link href={href} className="block">
			{content}
		</Link>
	);
}
