"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
	DataTableRowActions,
	type RowAction,
} from "@/components/data-table/data-table-row-actions";
import { Badge } from "@/components/ui/badge";
import type { Role } from "@/types";

interface BuildRoleColumnsArgs {
	userCountByRole: Record<string, number>;
	onDelete: (roleId: string) => void;
}

export function buildRoleColumns({
	userCountByRole,
	onDelete,
}: BuildRoleColumnsArgs): ColumnDef<Role>[] {
	return [
		{
			id: "actions",
			header: "",
			enableHiding: false,
			cell: ({ row }) => {
				const role = row.original;
				if (role.isSystem) return null;
				const actions: RowAction[] = [
					{
						label: "Eliminar",
						icon: Trash2,
						variant: "destructive",
						onClick: () => onDelete(role.id),
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
				<div className="flex items-center gap-2">
					<Link
						href={`/admin/roles/${row.original.id}`}
						className="font-medium hover:underline"
					>
						{row.original.name}
					</Link>
					{row.original.isSystem && <Badge variant="secondary">Sistema</Badge>}
				</div>
			),
		},
		{
			accessorKey: "description",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Descripción" />
			),
			meta: { title: "Descripción" },
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.original.description ?? "—"}
				</span>
			),
		},
		{
			id: "userCount",
			accessorFn: (role) => userCountByRole[role.id] ?? 0,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Usuarios" />
			),
			meta: { title: "Usuarios" },
		},
	];
}
