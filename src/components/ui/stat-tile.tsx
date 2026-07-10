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
	/** Tiñe el valor, ícono y borde izquierdo con los colores semánticos de estado de stock. */
	tone?: "default" | "warning" | "critical";
	/** Resalta la tarjeta como la métrica principal de la fila (borde e ícono en color primario). */
	highlight?: boolean;
}

const TONE_VALUE_CLASSNAME: Record<
	NonNullable<StatTileProps["tone"]>,
	string
> = {
	default: "text-foreground",
	warning: "text-(--stock-bajo-fg)",
	critical: "text-(--stock-critico-fg)",
};

const TONE_ICON_CLASSNAME: Record<
	NonNullable<StatTileProps["tone"]>,
	string
> = {
	default: "bg-muted text-muted-foreground",
	warning: "bg-(--stock-bajo-bg) text-(--stock-bajo-fg)",
	critical: "bg-(--stock-critico-bg) text-(--stock-critico-fg)",
};

const TONE_BORDER_CLASSNAME: Record<
	NonNullable<StatTileProps["tone"]>,
	string
> = {
	default: "border-l-border",
	warning: "border-l-(--stock-bajo-fg)",
	critical: "border-l-(--stock-critico-fg)",
};

/**
 * Tarjeta de KPI: un número grande con su etiqueta, para filas de estadísticas (ej. `/inicio`).
 * `tone` tiñe el valor/ícono/borde con los colores semánticos de estado de stock (warning/critical)
 * para alertas; `highlight` resalta la métrica principal de la fila en color primario; `href`
 * vuelve toda la tarjeta clickeable.
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
	highlight = false,
}: StatTileProps) {
	const content = (
		<Card
			className={cn(
				"h-full border-l-4",
				highlight ? "border-l-primary" : TONE_BORDER_CLASSNAME[tone],
				href && "transition-colors hover:bg-muted/50",
			)}
		>
			<CardContent className="flex h-full items-start justify-between gap-3">
				<div className="flex flex-col gap-1">
					<span className="text-muted-foreground text-sm">{label}</span>
					<span
						className={cn(
							"font-semibold text-2xl tabular-nums",
							TONE_VALUE_CLASSNAME[tone],
						)}
					>
						{value}
					</span>
					<span className="text-muted-foreground text-xs">
						{description ?? " "}
					</span>
				</div>
				{Icon && (
					<div
						className={cn(
							"rounded-lg p-2",
							highlight
								? "bg-sidebar-accent text-sidebar-accent-foreground"
								: TONE_ICON_CLASSNAME[tone],
						)}
					>
						<Icon className="size-4" />
					</div>
				)}
			</CardContent>
		</Card>
	);

	if (!href) return content;
	return (
		<Link href={href} className="block h-full">
			{content}
		</Link>
	);
}
