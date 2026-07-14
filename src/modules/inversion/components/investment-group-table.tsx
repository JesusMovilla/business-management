"use client";

import { Download, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { PermissionGuard } from "@/components/guards/permission-guard";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { downloadCsv, toCsv } from "@/lib/csv";
import type { InvestmentGroup, User } from "@/types";
import { useInvestmentGroupsController } from "../hooks/use-investment-groups";
import { INVESTMENT_GROUP_STATUS_LABELS } from "./investment-form-schema";
import { InvestmentGroupFormDialog } from "./investment-group-form-dialog";
import { buildInvestmentGroupColumns } from "./investment-group-table-columns";

interface InvestmentGroupTableProps {
	initialGroups: InvestmentGroup[];
	users: User[];
}

export function InvestmentGroupTable({
	initialGroups,
	users,
}: InvestmentGroupTableProps) {
	const { groups, addGroup, updateGroup, removeGroup, isPending } =
		useInvestmentGroupsController(initialGroups);

	const [formOpen, setFormOpen] = useState(false);
	const [editingGroup, setEditingGroup] = useState<InvestmentGroup | null>(
		null,
	);
	const [groupToDelete, setGroupToDelete] = useState<InvestmentGroup | null>(
		null,
	);
	const [formSessionId, setFormSessionId] = useState(0);

	const handleExportCsv = () => {
		const header = ["Nombre", "Estado", "Integrantes"];
		const rows = groups.map((group) => [
			group.name,
			INVESTMENT_GROUP_STATUS_LABELS[group.status],
			group.memberUserIds
				.map((userId) => users.find((u) => u.id === userId)?.fullName ?? userId)
				.join(" | "),
		]);
		downloadCsv(
			`grupos-inversion-${new Date().toISOString().slice(0, 10)}.csv`,
			toCsv([header, ...rows]),
		);
	};

	const columns = useMemo(
		() =>
			buildInvestmentGroupColumns({
				users,
				onEdit: (group) => {
					setEditingGroup(group);
					setFormSessionId((id) => id + 1);
					setFormOpen(true);
				},
				onDelete: setGroupToDelete,
				isPending,
			}),
		[users, isPending],
	);

	return (
		<div className="flex flex-col gap-4">
			<DataTable
				columns={columns}
				data={groups}
				emptyMessage="No hay grupos inversionistas registrados."
				toolbarActions={
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleExportCsv}
							disabled={groups.length === 0}
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
									setEditingGroup(null);
									setFormSessionId((id) => id + 1);
									setFormOpen(true);
								}}
							>
								<Plus className="size-4" />
								Nuevo grupo
							</Button>
						</PermissionGuard>
					</div>
				}
			/>

			<InvestmentGroupFormDialog
				key={formSessionId}
				open={formOpen}
				onOpenChange={setFormOpen}
				group={editingGroup}
				users={users}
				onSubmit={(values) => {
					if (editingGroup) {
						updateGroup(editingGroup.id, values);
					} else {
						addGroup(values);
					}
				}}
			/>

			<AlertDialog
				open={!!groupToDelete}
				onOpenChange={(open) => !open && setGroupToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Eliminar grupo</AlertDialogTitle>
						<AlertDialogDescription>
							¿Seguro que quieres eliminar &quot;{groupToDelete?.name}&quot;?
							Esta acción no se puede deshacer.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							disabled={isPending}
							onClick={() => {
								if (groupToDelete) removeGroup(groupToDelete.id);
								setGroupToDelete(null);
							}}
						>
							Eliminar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
