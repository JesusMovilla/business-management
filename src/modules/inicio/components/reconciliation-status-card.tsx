import Link from "next/link";
import { CashClosingStatusBadge } from "@/modules/cierre-caja/components/cash-closing-status-badge";
import type { BalanceStatus, ReconciliationBreakdown } from "@/types";

const ROWS: { status: BalanceStatus; description: string }[] = [
	{ status: "ok", description: "Cierres que cuadraron exacto" },
	{ status: "sobrante", description: "Dinero real por encima de lo esperado" },
	{ status: "faltante", description: "Dinero real por debajo de lo esperado" },
];

/**
 * Conteo de cierres de caja por estado de conciliación en el período seleccionado. Reutiliza el
 * mismo badge de estado (colores reservados, no categóricos) que ya usa Cierre de caja.
 */
export function ReconciliationStatusCard({
	data,
}: {
	data: ReconciliationBreakdown;
}) {
	return (
		<div className="flex flex-col gap-3">
			{ROWS.map((row) => (
				<Link
					key={row.status}
					href="/cierre-caja"
					className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
				>
					<div className="flex items-center gap-3">
						<CashClosingStatusBadge status={row.status} />
						<span className="text-muted-foreground text-xs">
							{row.description}
						</span>
					</div>
					<span className="font-semibold text-lg tabular-nums">
						{data[row.status]}
					</span>
				</Link>
			))}
		</div>
	);
}
