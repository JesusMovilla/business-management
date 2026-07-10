import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StockMovement, StockMovementType } from "@/types";

const TYPE_LABELS: Record<StockMovementType, string> = {
	entrada: "Entrada",
	venta: "Venta",
	merma: "Merma",
	ajuste: "Ajuste",
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
		<ul className="flex h-full flex-col justify-between divide-y">
			{rows.map(({ movement, productName }) => {
				const isPositive = movement.delta >= 0;
				return (
					<li key={movement.id} className="flex items-center gap-2.5 py-2.5">
						<div
							className={cn(
								"flex size-7 shrink-0 items-center justify-center rounded-full",
								isPositive
									? "bg-(--stock-ok-bg) text-(--stock-ok-fg)"
									: "bg-muted text-muted-foreground",
							)}
						>
							{isPositive ? (
								<ArrowUp className="size-3.5" />
							) : (
								<ArrowDown className="size-3.5" />
							)}
						</div>
						<div className="min-w-0 flex-1">
							<Link
								href={`/inventario/${movement.productId}`}
								className="block truncate font-medium text-sm hover:underline"
							>
								{productName}
							</Link>
							<div className="text-muted-foreground text-xs">
								{TYPE_LABELS[movement.type]} ·{" "}
								<span title={formatDateTime(movement.date)}>
									{formatRelativeTime(movement.date)}
								</span>
							</div>
						</div>
						<span
							className={cn(
								"shrink-0 font-bold text-sm tabular-nums",
								isPositive
									? "text-(--stock-ok-fg)"
									: "text-(--stock-critico-fg)",
							)}
						>
							{isPositive ? "+" : ""}
							{movement.delta}
						</span>
					</li>
				);
			})}
		</ul>
	);
}
