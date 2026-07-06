"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Category, ProductWithMargin } from "@/types";
import { isLowMargin } from "../lib/calc-margin";

interface BuildPriceMarginColumnsArgs {
	categories: Category[];
}

export function buildPriceMarginColumns({
	categories,
}: BuildPriceMarginColumnsArgs): ColumnDef<ProductWithMargin>[] {
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
			cell: ({ row }) =>
				categories.find((c) => c.id === row.original.categoryId)?.name ?? "—",
		},
		{
			accessorKey: "pricing.cost",
			id: "cost",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Costo" />
			),
			meta: { title: "Costo" },
			cell: ({ row }) => formatCurrency(row.original.pricing.cost),
		},
		{
			accessorKey: "pricing.retailPrice",
			id: "retailPrice",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Precio público" />
			),
			meta: { title: "Precio público" },
			cell: ({ row }) => formatCurrency(row.original.pricing.retailPrice),
		},
		{
			accessorKey: "marginRetail",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Margen público" />
			),
			meta: { title: "Margen público" },
			cell: ({ row }) => (
				<span
					className={cn(
						isLowMargin(row.original.marginRetail) &&
							"font-medium text-destructive",
					)}
				>
					{formatPercent(row.original.marginRetail)}
				</span>
			),
		},
	];
}
