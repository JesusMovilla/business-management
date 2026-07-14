"use client";

import type { FilterFn } from "@tanstack/react-table";
import { Download, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { Button } from "@/components/ui/button";
import { downloadCsv, toCsv } from "@/lib/csv";
import type { InvestmentGroup, ProfitPayout } from "@/types";
import { useProfitPayoutsController } from "../hooks/use-profit-payouts";
import { ProfitPayoutFormDialog } from "./profit-payout-form-dialog";
import { PROFIT_PAYOUT_STATUS_LABELS } from "./profit-payout-form-schema";
import { buildProfitPayoutColumns } from "./profit-payout-table-columns";
import { ProfitPayoutVoidDialog } from "./profit-payout-void-dialog";

const globalFilterFn: FilterFn<ProfitPayout> = (row, _columnId, value) => {
	const search = String(value).toLowerCase();
	return row.original.note.toLowerCase().includes(search);
};

interface ProfitPayoutTableProps {
	initialPayouts: ProfitPayout[];
	groups: InvestmentGroup[];
}

export function ProfitPayoutTable({
	initialPayouts,
	groups,
}: ProfitPayoutTableProps) {
	const { payouts, addPayout, voidPayout, isPending } =
		useProfitPayoutsController(initialPayouts);

	const [formOpen, setFormOpen] = useState(false);
	const [payoutToVoid, setPayoutToVoid] = useState<ProfitPayout | null>(null);
	// Cambia en cada apertura para forzar el remount de `ProfitPayoutFormDialog` (ver su JSDoc).
	const [formSessionId, setFormSessionId] = useState(0);

	const groupName = (id: string) =>
		groups.find((g) => g.id === id)?.name ?? "Sin grupo";

	const handleExportCsv = () => {
		const header = ["Fecha", "Período / nota", "Grupo", "Valor", "Estado"];
		const rows = payouts.map((payout) => [
			payout.date,
			payout.note,
			groupName(payout.groupId),
			String(payout.amount),
			PROFIT_PAYOUT_STATUS_LABELS[payout.status],
		]);
		downloadCsv(
			`pagos-ganancias-${new Date().toISOString().slice(0, 10)}.csv`,
			toCsv([header, ...rows]),
		);
	};

	const columns = useMemo(
		() =>
			buildProfitPayoutColumns({
				groups,
				onVoid: setPayoutToVoid,
				isPending,
			}),
		[groups, isPending],
	);

	return (
		<div className="flex flex-col gap-4">
			<DataTable
				columns={columns}
				data={payouts}
				searchPlaceholder="Buscar por período / nota..."
				globalFilterFn={globalFilterFn}
				emptyMessage="No hay pagos registrados."
				toolbarActions={
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleExportCsv}
							disabled={payouts.length === 0}
						>
							<Download className="size-4" />
							Exportar CSV
						</Button>
						<PermissionGuard module="proyeccion" action="crear">
							<Button
								type="button"
								size="sm"
								disabled={isPending}
								onClick={() => {
									setFormSessionId((id) => id + 1);
									setFormOpen(true);
								}}
							>
								<Plus className="size-4" />
								Registrar pago
							</Button>
						</PermissionGuard>
					</div>
				}
			/>

			<ProfitPayoutFormDialog
				key={formSessionId}
				open={formOpen}
				onOpenChange={setFormOpen}
				groups={groups}
				onSubmit={(values) => addPayout(values)}
			/>

			<ProfitPayoutVoidDialog
				payout={payoutToVoid}
				onOpenChange={(open) => !open && setPayoutToVoid(null)}
				isPending={isPending}
				onConfirm={(id, reason) => {
					voidPayout(id, reason);
					setPayoutToVoid(null);
				}}
			/>
		</div>
	);
}
