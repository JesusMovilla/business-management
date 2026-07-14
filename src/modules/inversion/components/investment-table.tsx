"use client";

import type { FilterFn } from "@tanstack/react-table";
import { Download, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { Button } from "@/components/ui/button";
import { downloadCsv, toCsv } from "@/lib/csv";
import type { Investment, InvestmentGroup } from "@/types";
import { useInvestmentsController } from "../hooks/use-investments";
import { InvestmentFormDialog } from "./investment-form-dialog";
import { INVESTMENT_STATUS_LABELS } from "./investment-form-schema";
import { buildInvestmentColumns } from "./investment-table-columns";
import { InvestmentVoidDialog } from "./investment-void-dialog";

const globalFilterFn: FilterFn<Investment> = (row, _columnId, value) => {
	const search = String(value).toLowerCase();
	return row.original.description.toLowerCase().includes(search);
};

interface InvestmentTableProps {
	initialInvestments: Investment[];
	groups: InvestmentGroup[];
}

export function InvestmentTable({
	initialInvestments,
	groups,
}: InvestmentTableProps) {
	const {
		investments,
		addInvestment,
		updateInvestment,
		voidInvestment,
		isPending,
	} = useInvestmentsController(initialInvestments);

	const [formOpen, setFormOpen] = useState(false);
	const [editingInvestment, setEditingInvestment] = useState<Investment | null>(
		null,
	);
	const [investmentToVoid, setInvestmentToVoid] = useState<Investment | null>(
		null,
	);
	// Cambia en cada apertura para forzar el remount de `InvestmentFormDialog` (ver su JSDoc).
	const [formSessionId, setFormSessionId] = useState(0);

	const groupName = (id: string) =>
		groups.find((g) => g.id === id)?.name ?? "Sin grupo";

	const handleExportCsv = () => {
		const header = ["Fecha", "Descripción", "Grupo", "Valor", "Estado"];
		const rows = investments.map((investment) => [
			investment.date,
			investment.description,
			groupName(investment.groupId),
			String(investment.amount),
			INVESTMENT_STATUS_LABELS[investment.status],
		]);
		downloadCsv(
			`inversiones-${new Date().toISOString().slice(0, 10)}.csv`,
			toCsv([header, ...rows]),
		);
	};

	const columns = useMemo(
		() =>
			buildInvestmentColumns({
				groups,
				onEdit: (investment) => {
					setEditingInvestment(investment);
					setFormSessionId((id) => id + 1);
					setFormOpen(true);
				},
				onVoid: setInvestmentToVoid,
				isPending,
			}),
		[groups, isPending],
	);

	return (
		<div className="flex flex-col gap-4">
			<DataTable
				columns={columns}
				data={investments}
				searchPlaceholder="Buscar por descripción..."
				globalFilterFn={globalFilterFn}
				emptyMessage="No hay inversiones registradas."
				toolbarActions={
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleExportCsv}
							disabled={investments.length === 0}
						>
							<Download className="size-4" />
							Exportar CSV
						</Button>
						<PermissionGuard module="inversion" action="crear">
							<Button
								type="button"
								size="sm"
								disabled={isPending}
								onClick={() => {
									setEditingInvestment(null);
									setFormSessionId((id) => id + 1);
									setFormOpen(true);
								}}
							>
								<Plus className="size-4" />
								Nueva inversión
							</Button>
						</PermissionGuard>
					</div>
				}
			/>

			<InvestmentFormDialog
				key={formSessionId}
				open={formOpen}
				onOpenChange={setFormOpen}
				investment={editingInvestment}
				groups={groups}
				onSubmit={(values) => {
					if (editingInvestment) {
						updateInvestment(editingInvestment.id, values);
					} else {
						addInvestment(values);
					}
				}}
			/>

			<InvestmentVoidDialog
				investment={investmentToVoid}
				onOpenChange={(open) => !open && setInvestmentToVoid(null)}
				isPending={isPending}
				onConfirm={(id, reason) => {
					voidInvestment(id, reason);
					setInvestmentToVoid(null);
				}}
			/>
		</div>
	);
}
