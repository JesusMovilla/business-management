"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import type { InventoryIndicatorRow } from "@/data/repositories/rentabilidad-dashboard-repository";
import { formatCurrency, formatPercent } from "@/lib/format";

export function buildInventoryIndicatorsColumns(): ColumnDef<InventoryIndicatorRow>[] {
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
						{row.original.presentation}
					</span>
				</div>
			),
		},
		{
			accessorKey: "quantity",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Inventario" />
			),
			meta: { title: "Inventario" },
		},
		{
			accessorKey: "velocidadDiaria",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Velocidad diaria" />
			),
			meta: { title: "Velocidad diaria" },
			cell: ({ row }) => row.original.velocidadDiaria.toFixed(2),
		},
		{
			accessorKey: "sellThroughPercent",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Sell-through" />
			),
			meta: { title: "Sell-through" },
			cell: ({ row }) =>
				row.original.sellThroughPercent === null
					? "—"
					: formatPercent(row.original.sellThroughPercent),
		},
		{
			accessorKey: "diasCobertura",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Días de cobertura" />
			),
			meta: { title: "Días de cobertura" },
			cell: ({ row }) =>
				row.original.diasCobertura === null
					? "—"
					: Math.round(row.original.diasCobertura),
		},
		{
			accessorKey: "rotacion",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Rotación" />
			),
			meta: { title: "Rotación" },
			cell: ({ row }) =>
				row.original.rotacion === null ? "—" : row.original.rotacion.toFixed(2),
		},
		{
			accessorKey: "rangoAntiguedad",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Antigüedad"
					filter={{
						type: "select",
						options: [
							{ label: "0-30 días", value: "0-30" },
							{ label: "31-60 días", value: "31-60" },
							{ label: "61-90 días", value: "61-90" },
							{ label: "91-180 días", value: "91-180" },
							{ label: "+180 días", value: "+180" },
							{ label: "Sin entradas", value: "sin entradas" },
						],
					}}
				/>
			),
			meta: { title: "Antigüedad" },
			filterFn: "arrIncludesSome",
		},
		{
			id: "detenido",
			accessorFn: (row) => (row.detenido ? "detenido" : "activo"),
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Estado"
					filter={{
						type: "select",
						options: [
							{ label: "Detenido", value: "detenido" },
							{ label: "Activo", value: "activo" },
						],
					}}
				/>
			),
			meta: { title: "Estado" },
			filterFn: "arrIncludesSome",
			cell: ({ row }) =>
				row.original.detenido ? (
					<Badge variant="destructive">Detenido</Badge>
				) : (
					<Badge variant="secondary">Activo</Badge>
				),
		},
		{
			accessorKey: "capitalInmovilizado",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Capital inmovilizado" />
			),
			meta: { title: "Capital inmovilizado" },
			cell: ({ row }) => formatCurrency(row.original.capitalInmovilizado),
		},
	];
}
