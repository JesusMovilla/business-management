"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
	DataTableRowActions,
	type RowAction,
} from "@/components/data-table/data-table-row-actions";
import type { Contact } from "@/types";

interface BuildContactColumnsArgs {
	onEdit: (contact: Contact) => void;
	onDelete: (contact: Contact) => void;
	isPending?: boolean;
}

export function buildContactColumns({
	onEdit,
	onDelete,
	isPending,
}: BuildContactColumnsArgs): ColumnDef<Contact>[] {
	return [
		{
			id: "actions",
			header: "",
			enableHiding: false,
			cell: ({ row }) => {
				const contact = row.original;
				const actions: RowAction[] = [
					{
						label: "Editar",
						icon: Pencil,
						onClick: () => onEdit(contact),
						permission: { module: "contactos", action: "editar" },
						disabled: isPending,
					},
					{
						label: "Eliminar",
						icon: Trash2,
						variant: "destructive",
						onClick: () => onDelete(contact),
						permission: { module: "contactos", action: "eliminar" },
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
			accessorKey: "phone",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Teléfono"
					filter={{ type: "text" }}
				/>
			),
			meta: { title: "Teléfono" },
			filterFn: "includesString",
			cell: ({ row }) => (
				<span className="text-muted-foreground">{row.original.phone}</span>
			),
		},
		{
			accessorKey: "description",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="A qué se dedica"
					filter={{ type: "text" }}
				/>
			),
			meta: { title: "A qué se dedica" },
			filterFn: "includesString",
			cell: ({ row }) => row.original.description || "—",
		},
	];
}
