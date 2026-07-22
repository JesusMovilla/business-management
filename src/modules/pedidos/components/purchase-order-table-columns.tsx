"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Ban, Inbox, Pencil, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
	DataTableRowActions,
	type RowAction,
} from "@/components/data-table/data-table-row-actions";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import type { PurchaseOrder } from "@/types";
import { purchaseOrderTotal } from "@/types";

interface BuildPurchaseOrderColumnsArgs {
	onEdit: (order: PurchaseOrder) => void;
	onReceive: (order: PurchaseOrder) => void;
	onCancel: (order: PurchaseOrder) => void;
	onRemove: (order: PurchaseOrder) => void;
	isPending?: boolean;
}

export const PURCHASE_ORDER_STATUS_LABELS: Record<
	PurchaseOrder["status"],
	string
> = {
	borrador: "Borrador",
	recibido: "Recibido",
	cancelado: "Cancelado",
};

const STATUS_BADGE_VARIANT: Record<
	PurchaseOrder["status"],
	"default" | "secondary" | "destructive"
> = {
	borrador: "secondary",
	recibido: "default",
	cancelado: "destructive",
};

export function buildPurchaseOrderColumns({
	onEdit,
	onReceive,
	onCancel,
	onRemove,
	isPending,
}: BuildPurchaseOrderColumnsArgs): ColumnDef<PurchaseOrder>[] {
	return [
		{
			id: "actions",
			header: "",
			enableHiding: false,
			cell: ({ row }) => {
				const order = row.original;
				const isDraft = order.status === "borrador";
				const actions: RowAction[] = [
					{
						label: "Editar",
						icon: Pencil,
						onClick: () => onEdit(order),
						permission: { module: "pedidos", action: "editar" },
						disabled: isPending || !isDraft,
					},
					{
						label: "Confirmar recepción",
						icon: Inbox,
						onClick: () => onReceive(order),
						permission: { module: "pedidos", action: "editar" },
						disabled: isPending || !isDraft,
					},
					{
						label: "Cancelar",
						icon: Ban,
						variant: "destructive",
						onClick: () => onCancel(order),
						permission: { module: "pedidos", action: "editar" },
						disabled: isPending || !isDraft,
					},
					{
						label: "Eliminar",
						icon: Trash2,
						variant: "destructive",
						onClick: () => onRemove(order),
						permission: { module: "pedidos", action: "eliminar" },
						disabled: isPending || !isDraft,
					},
				];
				return <DataTableRowActions actions={actions} />;
			},
		},
		{
			accessorKey: "supplier",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Proveedor" />
			),
			meta: { title: "Proveedor" },
			cell: ({ row }) => (
				<div className="flex flex-col">
					<span className="font-medium">{row.original.supplier}</span>
					{row.original.note && (
						<span className="text-muted-foreground text-xs">
							{row.original.note}
						</span>
					)}
				</div>
			),
		},
		{
			accessorKey: "orderDate",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Fecha del pedido" />
			),
			meta: { title: "Fecha del pedido" },
		},
		{
			id: "lineCount",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Productos" />
			),
			meta: { title: "Productos" },
			cell: ({ row }) => row.original.lines.length,
		},
		{
			id: "total",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Total" />
			),
			meta: { title: "Total" },
			cell: ({ row }) => formatCurrency(purchaseOrderTotal(row.original)),
		},
		{
			accessorKey: "status",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Estado"
					filter={{
						type: "select",
						options: Object.entries(PURCHASE_ORDER_STATUS_LABELS).map(
							([value, label]) => ({ label, value }),
						),
					}}
				/>
			),
			meta: { title: "Estado" },
			filterFn: "arrIncludesSome",
			cell: ({ row }) => (
				<Badge variant={STATUS_BADGE_VARIANT[row.original.status]}>
					{PURCHASE_ORDER_STATUS_LABELS[row.original.status]}
				</Badge>
			),
		},
		{
			accessorKey: "receivedDate",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Fecha de recepción" />
			),
			meta: { title: "Fecha de recepción" },
			cell: ({ row }) => row.original.receivedDate ?? "—",
		},
	];
}
