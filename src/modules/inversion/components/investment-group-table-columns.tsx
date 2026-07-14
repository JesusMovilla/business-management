"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
	DataTableRowActions,
	type RowAction,
} from "@/components/data-table/data-table-row-actions";
import { Badge } from "@/components/ui/badge";
import type { InvestmentGroup, User } from "@/types";
import { INVESTMENT_GROUP_STATUS_LABELS } from "./investment-form-schema";

interface BuildInvestmentGroupColumnsArgs {
	users: User[];
	onEdit: (group: InvestmentGroup) => void;
	onDelete: (group: InvestmentGroup) => void;
	isPending?: boolean;
}

export function buildInvestmentGroupColumns({
	users,
	onEdit,
	onDelete,
	isPending,
}: BuildInvestmentGroupColumnsArgs): ColumnDef<InvestmentGroup>[] {
	const userName = (id: string) =>
		users.find((u) => u.id === id)?.fullName ?? "Usuario eliminado";

	return [
		{
			id: "actions",
			header: "",
			enableHiding: false,
			cell: ({ row }) => {
				const actions: RowAction[] = [
					{
						label: "Editar",
						icon: Pencil,
						onClick: () => onEdit(row.original),
						permission: { module: "inversion", action: "editar" },
						disabled: isPending,
					},
					{
						label: "Eliminar",
						icon: Trash2,
						variant: "destructive",
						onClick: () => onDelete(row.original),
						permission: { module: "inversion", action: "eliminar" },
						disabled: isPending,
					},
				];
				return <DataTableRowActions actions={actions} />;
			},
		},
		{
			accessorKey: "name",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Nombre" />
			),
			meta: { title: "Nombre" },
			cell: ({ row }) => (
				<span className="font-medium">{row.original.name}</span>
			),
		},
		{
			id: "members",
			header: "Integrantes",
			enableSorting: false,
			cell: ({ row }) => (
				<div className="flex flex-wrap gap-1">
					{row.original.memberUserIds.map((userId) => (
						<Badge key={userId} variant="secondary">
							{userName(userId)}
						</Badge>
					))}
				</div>
			),
		},
		{
			accessorKey: "status",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Estado"
					filter={{
						type: "select",
						options: Object.entries(INVESTMENT_GROUP_STATUS_LABELS).map(
							([value, label]) => ({ label, value }),
						),
					}}
				/>
			),
			meta: { title: "Estado" },
			filterFn: "arrIncludesSome",
			cell: ({ row }) => (
				<Badge
					variant={row.original.status === "activo" ? "default" : "secondary"}
				>
					{INVESTMENT_GROUP_STATUS_LABELS[row.original.status]}
				</Badge>
			),
		},
	];
}
