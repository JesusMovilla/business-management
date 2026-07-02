import { cn } from "@/lib/utils";
import type { StockStatus } from "@/types";
import { STOCK_STATUS_LABELS } from "../lib/stock-status";

const CLASSNAME_BY_STATUS: Record<StockStatus, string> = {
	ok: "bg-(--stock-ok-bg) text-(--stock-ok-fg)",
	bajo: "bg-(--stock-bajo-bg) text-(--stock-bajo-fg)",
	critico: "bg-(--stock-critico-bg) text-(--stock-critico-fg)",
};

/** Badge de estado de stock (ok/bajo/crítico), con colores semánticos propios que se adaptan a modo oscuro. */
export function StockBadge({
	status,
	quantity,
}: {
	status: StockStatus;
	quantity: number;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
				CLASSNAME_BY_STATUS[status],
			)}
		>
			{quantity} · {STOCK_STATUS_LABELS[status]}
		</span>
	);
}
