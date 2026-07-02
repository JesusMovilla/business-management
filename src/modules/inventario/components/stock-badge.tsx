import { Badge } from "@/components/ui/badge";
import type { StockStatus } from "@/types";
import { STOCK_STATUS_LABELS } from "../lib/stock-status";

const VARIANT_BY_STATUS: Record<
	StockStatus,
	"default" | "outline" | "destructive"
> = {
	ok: "outline",
	bajo: "default",
	critico: "destructive",
};

export function StockBadge({
	status,
	quantity,
}: {
	status: StockStatus;
	quantity: number;
}) {
	return (
		<Badge variant={VARIANT_BY_STATUS[status]}>
			{quantity} · {STOCK_STATUS_LABELS[status]}
		</Badge>
	);
}
