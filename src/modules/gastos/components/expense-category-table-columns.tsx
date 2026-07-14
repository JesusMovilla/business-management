"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
	DataTableRowActions,
	type RowAction,
} from "@/components/data-table/data-table-row-actions";
import type { ExpenseCategory } from "@/types";

interface BuildExpenseCategoryColumnsArgs {
	categories: ExpenseCategory[];
	onDelete: (categoryId: string) => void;
	isPending?: boolean;
}

export function buildExpenseCategoryColumns({
	categories,
	onDelete,
	isPending,
}: BuildExpenseCategoryColumnsArgs): ColumnDef<ExpenseCategory>[] {
	const parentName = (id?: string) =>
		id ? (categories.find((c) => c.id === id)?.name ?? "—") : "—";

	return [
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
						permission: { module: "gastos", action: "eliminar" },
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
			accessorKey: "parentId",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Categoría padre" />
			),
			meta: { title: "Categoría padre" },
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{parentName(row.original.parentId)}
				</span>
			),
		},
	];
}
