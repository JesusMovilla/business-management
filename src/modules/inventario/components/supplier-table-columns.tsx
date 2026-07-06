"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
	DataTableRowActions,
	type RowAction,
} from "@/components/data-table/data-table-row-actions";
import type { Supplier } from "@/types";

interface BuildSupplierColumnsArgs {
	onDelete: (supplierId: string) => void;
	/** Id del proveedor cuyo borrado está en curso — deshabilita solo esa fila. */
	pendingId?: string | null;
}

export function buildSupplierColumns({
	onDelete,
	pendingId,
}: BuildSupplierColumnsArgs): ColumnDef<Supplier>[] {
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
						permission: { module: "inventario", action: "eliminar" },
						disabled: pendingId === row.original.id,
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
			accessorKey: "contactName",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Contacto" />
			),
			meta: { title: "Contacto" },
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.original.contactName ?? "—"}
				</span>
			),
		},
		{
			accessorKey: "phone",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Teléfono" />
			),
			meta: { title: "Teléfono" },
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.original.phone ?? "—"}
				</span>
			),
		},
		{
			accessorKey: "email",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Email" />
			),
			meta: { title: "Email" },
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.original.email ?? "—"}
				</span>
			),
		},
	];
}
