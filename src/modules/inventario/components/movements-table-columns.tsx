"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import type {
	MermaReason,
	Product,
	StockMovement,
	StockMovementType,
} from "@/types";

const TYPE_LABELS: Record<StockMovementType, string> = {
	entrada: "Entrada",
	venta: "Venta",
	merma: "Merma",
	ajuste: "Ajuste",
};

const TYPE_BADGE_VARIANT: Record<
	StockMovementType,
	"default" | "secondary" | "destructive" | "outline"
> = {
	entrada: "default",
	venta: "secondary",
	merma: "destructive",
	ajuste: "outline",
};

const MERMA_REASON_LABELS: Record<MermaReason, string> = {
	vencimiento: "Vencimiento",
	rotura: "Rotura",
	derrame: "Derrame",
	otro: "Otro",
};

interface BuildMovementsColumnsArgs {
	products: Product[];
	users: { id: string; fullName: string }[];
}

export function buildMovementsColumns({
	products,
	users,
}: BuildMovementsColumnsArgs): ColumnDef<StockMovement>[] {
	const productName = (id: string) =>
		products.find((product) => product.id === id)?.name ?? "—";
	const userName = (id: string) =>
		users.find((user) => user.id === id)?.fullName ?? "—";

	return [
		{
			accessorKey: "productId",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Producto"
					filter={{
						type: "select",
						options: products.map((p) => ({ label: p.name, value: p.id })),
					}}
				/>
			),
			meta: { title: "Producto" },
			filterFn: "arrIncludesSome",
			cell: ({ row }) => (
				<span className="font-medium">
					{productName(row.original.productId)}
				</span>
			),
		},
		{
			accessorKey: "type",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Tipo"
					filter={{
						type: "select",
						options: Object.entries(TYPE_LABELS).map(([value, label]) => ({
							label,
							value,
						})),
					}}
				/>
			),
			meta: { title: "Tipo" },
			filterFn: "arrIncludesSome",
			cell: ({ row }) => (
				<Badge variant={TYPE_BADGE_VARIANT[row.original.type]}>
					{TYPE_LABELS[row.original.type]}
				</Badge>
			),
		},
		{
			accessorKey: "delta",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Cantidad" />
			),
			meta: { title: "Cantidad" },
			cell: ({ row }) => (
				<span
					className={
						row.original.delta >= 0
							? "font-medium text-(--stock-ok-fg)"
							: "font-medium text-destructive"
					}
				>
					{row.original.delta >= 0 ? "+" : ""}
					{row.original.delta}
				</span>
			),
		},
		{
			id: "detail",
			header: "Motivo / Nota",
			enableSorting: false,
			cell: ({ row }) => {
				const movement = row.original;
				const reasonLabel = movement.reason
					? MERMA_REASON_LABELS[movement.reason]
					: undefined;
				return (
					<span className="text-muted-foreground text-sm">
						{[reasonLabel, movement.note].filter(Boolean).join(" · ") || "—"}
					</span>
				);
			},
		},
		{
			accessorKey: "userId",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Usuario" />
			),
			meta: { title: "Usuario" },
			cell: ({ row }) => userName(row.original.userId),
		},
		{
			accessorKey: "date",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Fecha" />
			),
			meta: { title: "Fecha" },
			cell: ({ row }) => formatDateTime(row.original.date),
		},
	];
}
