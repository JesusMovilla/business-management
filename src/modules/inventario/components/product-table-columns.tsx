"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
	DataTableRowActions,
	type RowAction,
} from "@/components/data-table/data-table-row-actions";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { Category, ProductWithMargin, Supplier } from "@/types";
import { STOCK_STATUS_LABELS } from "../lib/stock-status";
import { StockBadge } from "./stock-badge";

interface BuildColumnsArgs {
	categories: Category[];
	suppliers: Supplier[];
	onDelete: (product: ProductWithMargin) => void;
}

export function buildProductColumns({
	categories,
	suppliers,
	onDelete,
}: BuildColumnsArgs): ColumnDef<ProductWithMargin>[] {
	const categoryName = (id: string) =>
		categories.find((c) => c.id === id)?.name ?? "—";
	const supplierName = (id: string) =>
		suppliers.find((s) => s.id === id)?.name ?? "—";

	return [
		{
			accessorKey: "sku",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="SKU" />
			),
			meta: { title: "SKU" },
			cell: ({ row }) => (
				<span className="font-mono text-xs">{row.original.sku}</span>
			),
		},
		{
			accessorKey: "name",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Nombre" />
			),
			meta: { title: "Nombre" },
			cell: ({ row }) => (
				<div className="flex flex-col">
					<span className="font-medium">{row.original.name}</span>
					<span className="text-muted-foreground text-xs">
						{row.original.brand}
					</span>
				</div>
			),
		},
		{
			accessorKey: "categoryId",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Categoría"
					filter={{
						type: "select",
						options: categories.map((c) => ({ label: c.name, value: c.id })),
					}}
				/>
			),
			meta: { title: "Categoría" },
			filterFn: "arrIncludesSome",
			cell: ({ row }) => (
				<Badge variant="secondary">
					{categoryName(row.original.categoryId)}
				</Badge>
			),
		},
		{
			accessorKey: "presentation",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Presentación" />
			),
			meta: { title: "Presentación" },
		},
		{
			accessorKey: "stockStatus",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Stock"
					filter={{
						type: "select",
						options: Object.entries(STOCK_STATUS_LABELS).map(
							([value, label]) => ({ label, value }),
						),
					}}
				/>
			),
			meta: { title: "Stock" },
			filterFn: "arrIncludesSome",
			cell: ({ row }) => (
				<StockBadge
					status={row.original.stockStatus}
					quantity={row.original.stock.quantity}
				/>
			),
		},
		{
			accessorKey: "pricing.retailPrice",
			id: "retailPrice",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Precio venta" />
			),
			meta: { title: "Precio venta" },
			cell: ({ row }) => formatCurrency(row.original.pricing.retailPrice),
		},
		{
			id: "margin",
			header: "Margen",
			enableSorting: false,
			cell: ({ row }) => formatPercent(row.original.marginRetail),
		},
		{
			accessorKey: "supplierId",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Proveedor"
					filter={{
						type: "select",
						options: suppliers.map((s) => ({ label: s.name, value: s.id })),
					}}
				/>
			),
			meta: { title: "Proveedor" },
			filterFn: "arrIncludesSome",
			cell: ({ row }) => supplierName(row.original.supplierId),
		},
		{
			id: "actions",
			header: "",
			enableHiding: false,
			cell: ({ row }) => {
				const product = row.original;
				const actions: RowAction[] = [
					{ label: "Ver detalle", href: `/inventario/${product.id}` },
					{
						label: "Editar",
						icon: Pencil,
						href: `/inventario/${product.id}/editar`,
						permission: { module: "inventario", action: "editar" },
					},
					{
						label: "Eliminar",
						icon: Trash2,
						variant: "destructive",
						onClick: () => onDelete(product),
						permission: { module: "inventario", action: "eliminar" },
					},
				];
				return <DataTableRowActions actions={actions} />;
			},
		},
	];
}
