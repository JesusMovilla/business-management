import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import type { StockMovement, StockMovementType } from "@/types";

const TYPE_LABELS: Record<StockMovementType, string> = {
	entrada: "Entrada",
	venta: "Venta",
	merma: "Merma",
	ajuste: "Ajuste",
};

const TYPE_BADGE_VARIANT: Record<
	StockMovementType,
	"default" | "secondary" | "destructive" | "outline"
> = {
	entrada: "default",
	venta: "secondary",
	merma: "destructive",
	ajuste: "outline",
};

export interface RecentMovementRow {
	movement: StockMovement;
	productName: string;
}

/** Últimos movimientos de stock de cualquier producto, más reciente primero. */
export function RecentMovementsCard({ rows }: { rows: RecentMovementRow[] }) {
	if (rows.length === 0) {
		return (
			<p className="py-8 text-center text-muted-foreground text-sm">
				Todavía no hay movimientos de stock registrados.
			</p>
		);
	}

	return (
		<ul className="flex flex-col divide-y">
			{rows.map(({ movement, productName }) => (
				<li
					key={movement.id}
					className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
				>
					<div className="flex items-center gap-2">
						<Badge variant={TYPE_BADGE_VARIANT[movement.type]}>
							{TYPE_LABELS[movement.type]}
						</Badge>
						<Link
							href={`/inventario/${movement.productId}`}
							className="hover:underline"
						>
							{productName}
						</Link>
					</div>
					<div className="flex items-center gap-3">
						<span
							className={
								movement.delta >= 0
									? "font-medium text-(--stock-ok-fg)"
									: "font-medium text-destructive"
							}
						>
							{movement.delta >= 0 ? "+" : ""}
							{movement.delta}
						</span>
						<span className="text-muted-foreground text-xs">
							{formatDateTime(movement.date)}
						</span>
					</div>
				</li>
			))}
		</ul>
	);
}
