"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { Category, ProductWithMargin, Supplier } from "@/types";
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
			header: "SKU",
			cell: ({ row }) => (
				<span className="font-mono text-xs">{row.original.sku}</span>
			),
		},
		{
			accessorKey: "name",
			header: "Nombre",
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
			header: "Categoría",
			cell: ({ row }) => (
				<Badge variant="secondary">
					{categoryName(row.original.categoryId)}
				</Badge>
			),
		},
		{
			accessorKey: "presentation",
			header: "Presentación",
		},
		{
			accessorKey: "stock",
			header: "Stock",
			cell: ({ row }) => (
				<StockBadge
					status={row.original.stockStatus}
					quantity={row.original.stock.quantity}
				/>
			),
		},
		{
			accessorKey: "pricing",
			header: "Precio venta",
			cell: ({ row }) => formatCurrency(row.original.pricing.retailPrice),
		},
		{
			id: "margin",
			header: "Margen",
			cell: ({ row }) => formatPercent(row.original.marginRetail),
		},
		{
			accessorKey: "supplierId",
			header: "Proveedor",
			cell: ({ row }) => supplierName(row.original.supplierId),
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => (
				// biome-ignore lint/a11y/noStaticElementInteractions: stops row-click propagation from the actions cell, the actual control is the button below
				// biome-ignore lint/a11y/useKeyWithClickEvents: no keyboard interaction needed, click-only propagation guard
				<div
					onClick={(event) => event.stopPropagation()}
					className="flex justify-end"
				>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button variant="ghost" size="icon-sm">
									<MoreHorizontal className="size-4" />
								</Button>
							}
						/>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								render={<Link href={`/inventario/${row.original.id}`} />}
							>
								Ver detalle
							</DropdownMenuItem>
							<PermissionGuard module="inventario" action="editar">
								<DropdownMenuItem
									render={
										<Link href={`/inventario/${row.original.id}/editar`} />
									}
								>
									Editar
								</DropdownMenuItem>
							</PermissionGuard>
							<PermissionGuard module="inventario" action="eliminar">
								<DropdownMenuItem
									variant="destructive"
									onClick={() => onDelete(row.original)}
								>
									Eliminar
								</DropdownMenuItem>
							</PermissionGuard>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];
}
