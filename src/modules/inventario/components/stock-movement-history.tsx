"use client";

import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { usersMock } from "@/modules/admin-permisos/mock-data/users.mock";
import type { MermaReason, StockMovement, StockMovementType } from "@/types";
import { useProductMovements } from "../hooks/use-stock-movements";

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

const MERMA_REASON_LABELS: Record<MermaReason, string> = {
	vencimiento: "Vencimiento",
	rotura: "Rotura",
	derrame: "Derrame",
	otro: "Otro",
};

function userName(userId: string): string {
	return usersMock.find((user) => user.id === userId)?.fullName ?? "—";
}

function movementDescription(movement: StockMovement): string {
	if (movement.type === "merma" && movement.reason) {
		return movement.note
			? `${MERMA_REASON_LABELS[movement.reason]} · ${movement.note}`
			: MERMA_REASON_LABELS[movement.reason];
	}
	return movement.note ?? "—";
}

/** Historial de movimientos de un producto, más reciente primero. Ver `docs/MODULES.md`. */
export function StockMovementHistory({ productId }: { productId: string }) {
	const movements = useProductMovements(productId);

	if (movements.length === 0) {
		return (
			<p className="text-muted-foreground text-sm">
				Este producto todavía no tiene movimientos registrados.
			</p>
		);
	}

	return (
		<ul className="flex flex-col divide-y">
			{movements.map((movement) => (
				<li
					key={movement.id}
					className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
				>
					<div className="flex items-center gap-2">
						<Badge variant={TYPE_BADGE_VARIANT[movement.type]}>
							{TYPE_LABELS[movement.type]}
						</Badge>
						<span className="text-muted-foreground">
							{movementDescription(movement)}
						</span>
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
							{userName(movement.userId)} · {formatDateTime(movement.date)}
						</span>
					</div>
				</li>
			))}
		</ul>
	);
}
