import { cn } from "@/lib/utils";
import type { BalanceStatus } from "@/types";
import { BALANCE_STATUS_LABELS } from "../lib/balance-status";

const CLASSNAME_BY_STATUS: Record<BalanceStatus, string> = {
	ok: "bg-(--balance-ok-bg) text-(--balance-ok-fg)",
	sobrante: "bg-(--balance-surplus-bg) text-(--balance-surplus-fg)",
	faltante: "bg-(--balance-shortage-bg) text-(--balance-shortage-fg)",
};

/** Badge de estado de conciliación (cuadra/sobrante/faltante), con colores semánticos propios que se adaptan a modo oscuro. */
export function CashClosingStatusBadge({ status }: { status: BalanceStatus }) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
				CLASSNAME_BY_STATUS[status],
			)}
		>
			{BALANCE_STATUS_LABELS[status]}
		</span>
	);
}
