"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { CashClosingSummary } from "@/data/repositories/cash-closing-repository";
import { formatCurrency } from "@/lib/format";
import { getBalanceStatus } from "../lib/balance-status";
import { CashClosingStatusBadge } from "./cash-closing-status-badge";

function formatDate(date: string): string {
	const [year, month, day] = date.split("-");
	return `${day}/${month}/${year}`;
}

export function buildCashClosingColumns(): ColumnDef<CashClosingSummary>[] {
	return [
		{
			accessorKey: "date",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Fecha" />
			),
			meta: { title: "Fecha" },
			cell: ({ row }) => (
				<span className="font-medium">{formatDate(row.original.date)}</span>
			),
		},
		{
			accessorKey: "totalQuantitySold",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Unidades vendidas" />
			),
			meta: { title: "Unidades vendidas" },
			cell: ({ row }) => row.original.totalQuantitySold,
		},
		{
			accessorKey: "expectedIncome",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Ingreso esperado" />
			),
			meta: { title: "Ingreso esperado" },
			cell: ({ row }) => formatCurrency(row.original.expectedIncome),
		},
		{
			accessorKey: "actualCash",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Dinero real" />
			),
			meta: { title: "Dinero real" },
			cell: ({ row }) => formatCurrency(row.original.actualCash),
		},
		{
			accessorKey: "difference",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Diferencia" />
			),
			meta: { title: "Diferencia" },
			cell: ({ row }) => {
				const { difference } = row.original;
				return (
					<div className="flex items-center gap-2">
						<CashClosingStatusBadge status={getBalanceStatus(difference)} />
						{difference !== 0 && (
							<span className="text-muted-foreground text-xs">
								{formatCurrency(Math.abs(difference))}
							</span>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: "reason",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Motivo"
					filter={{ type: "text" }}
				/>
			),
			meta: { title: "Motivo" },
			filterFn: "includesString",
			cell: ({ row }) => row.original.reason || "—",
		},
	];
}
