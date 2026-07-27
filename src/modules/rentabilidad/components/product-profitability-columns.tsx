"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/format";
import { QUADRANT_LABELS, type SalesProfitQuadrant } from "../lib/quadrant";

export interface ProductProfitabilityRow {
	productId: string;
	name: string;
	presentation: string;
	categoryName: string;
	unidadesVendidas: number;
	ventas: number;
	costoTotal: number;
	gananciaBruta: number;
	margenPercent: number | null;
	participacionVentasPercent: number;
	participacionGananciaPercent: number;
	inventarioDisponible: number;
	ultimaVenta: string;
	abcVentas: "A" | "B" | "C";
	abcGanancia: "A" | "B" | "C";
	quadrant: SalesProfitQuadrant;
	/** Precio al que efectivamente se vendió en promedio en el período — no el precio de lista
	 * actual del producto, que puede haber cambiado desde entonces. */
	precioVentaPromedio: number | null;
	precioListaActual: number | null;
}

const ABC_VARIANT: Record<
	"A" | "B" | "C",
	"default" | "secondary" | "outline"
> = {
	A: "default",
	B: "secondary",
	C: "outline",
};

export function buildProductProfitabilityColumns(): ColumnDef<ProductProfitabilityRow>[] {
	return [
		{
			accessorKey: "name",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Producto" />
			),
			meta: { title: "Producto" },
			cell: ({ row }) => (
				<div className="flex flex-col">
					<span className="font-medium">{row.original.name}</span>
					<span className="text-muted-foreground text-xs">
						{row.original.presentation} · {row.original.categoryName}
					</span>
				</div>
			),
		},
		{
			accessorKey: "unidadesVendidas",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Unidades" />
			),
			meta: { title: "Unidades" },
		},
		{
			accessorKey: "precioVentaPromedio",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Precio venta prom." />
			),
			meta: { title: "Precio venta prom." },
			cell: ({ row }) => {
				const { precioVentaPromedio, precioListaActual } = row.original;
				if (precioVentaPromedio === null) return "—";
				const changedSincePrice =
					precioListaActual !== null &&
					Math.abs(precioVentaPromedio - precioListaActual) > 1;
				return (
					<div className="flex flex-col">
						<span>{formatCurrency(precioVentaPromedio)}</span>
						{changedSincePrice && (
							<span className="text-muted-foreground text-xs">
								Precio actual: {formatCurrency(precioListaActual as number)}
							</span>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: "ventas",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Ventas" />
			),
			meta: { title: "Ventas" },
			cell: ({ row }) => formatCurrency(row.original.ventas),
		},
		{
			accessorKey: "gananciaBruta",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Ganancia bruta" />
			),
			meta: { title: "Ganancia bruta" },
			cell: ({ row }) => formatCurrency(row.original.gananciaBruta),
		},
		{
			accessorKey: "margenPercent",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Margen" />
			),
			meta: { title: "Margen" },
			cell: ({ row }) =>
				row.original.margenPercent === null
					? "—"
					: formatPercent(row.original.margenPercent),
		},
		{
			accessorKey: "participacionVentasPercent",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="% de ventas" />
			),
			meta: { title: "% de ventas" },
			cell: ({ row }) => formatPercent(row.original.participacionVentasPercent),
		},
		{
			accessorKey: "participacionGananciaPercent",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="% de ganancia" />
			),
			meta: { title: "% de ganancia" },
			cell: ({ row }) =>
				formatPercent(row.original.participacionGananciaPercent),
		},
		{
			id: "abc",
			header: "ABC (venta/ganancia)",
			enableSorting: false,
			cell: ({ row }) => (
				<div className="flex gap-1">
					<Badge variant={ABC_VARIANT[row.original.abcVentas]}>
						{row.original.abcVentas}
					</Badge>
					<Badge variant={ABC_VARIANT[row.original.abcGanancia]}>
						{row.original.abcGanancia}
					</Badge>
				</div>
			),
		},
		{
			id: "quadrant",
			header: "Cuadrante",
			enableSorting: false,
			cell: ({ row }) => (
				<Badge variant="outline">
					{QUADRANT_LABELS[row.original.quadrant]}
				</Badge>
			),
		},
		{
			accessorKey: "inventarioDisponible",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Inventario" />
			),
			meta: { title: "Inventario" },
		},
		{
			accessorKey: "ultimaVenta",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Última venta" />
			),
			meta: { title: "Última venta" },
		},
	];
}
