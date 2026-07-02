"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
	DataTableRowActions,
	type RowAction,
} from "@/components/data-table/data-table-row-actions";
import type { Category } from "@/types";

export function buildCategoryColumns(
	onDelete: (categoryId: string) => void,
): ColumnDef<Category>[] {
	return [
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
			id: "actions",
			header: "",
			enableHiding: false,
			cell: ({ row }) => {
				const actions: RowAction[] = [
					{
						label: "Eliminar",
						icon: Trash2,
						variant: "destructive",
						onClick: () => onDelete(row.original.id),
						permission: { module: "inventario", action: "eliminar" },
					},
				];
				return <DataTableRowActions actions={actions} />;
			},
		},
	];
}
