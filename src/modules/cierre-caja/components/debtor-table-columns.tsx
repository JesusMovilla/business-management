"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { HandCoins, History } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
	DataTableRowActions,
	type RowAction,
} from "@/components/data-table/data-table-row-actions";
import { Badge } from "@/components/ui/badge";
import type { DebtorSummary } from "@/data/repositories/debtor-repository";
import { formatCurrency } from "@/lib/format";
import type { Debtor } from "@/types";

function formatDate(date: string): string {
	const [year, month, day] = date.split("-");
	return `${day}/${month}/${year}`;
}

interface BuildDebtorColumnsOptions {
	onRegisterPayment: (debtor: Debtor) => void;
	isPending?: boolean;
}

export function buildDebtorColumns({
	onRegisterPayment,
	isPending,
}: BuildDebtorColumnsOptions): ColumnDef<DebtorSummary>[] {
	return [
		{
			id: "actions",
			cell: ({ row }) => {
				const debtor = row.original;
				const actions: RowAction[] = [
					{
						label: "Ver historial",
						icon: History,
						href: `/cierre-caja/deudores/${debtor.id}`,
					},
					{
						label: "Registrar abono",
						icon: HandCoins,
						onClick: () => onRegisterPayment(debtor),
						disabled: debtor.balance <= 0 || isPending,
						permission: { module: "cierre-caja", action: "crear" },
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
			accessorKey: "balance",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Balance" />
			),
			meta: { title: "Balance" },
			cell: ({ row }) => {
				const { balance } = row.original;
				return balance > 0 ? (
					<div className="flex items-center gap-2">
						<Badge className="bg-(--balance-shortage-bg) text-(--balance-shortage-fg)">
							Debe
						</Badge>
						<span className="text-sm">{formatCurrency(balance)}</span>
					</div>
				) : (
					<Badge className="bg-(--balance-ok-bg) text-(--balance-ok-fg)">
						Al día
					</Badge>
				);
			},
		},
		{
			accessorKey: "lastActivityDate",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Última actividad" />
			),
			meta: { title: "Última actividad" },
			cell: ({ row }) => {
				const { lastActivityDate } = row.original;
				return lastActivityDate ? formatDate(lastActivityDate) : "—";
			},
		},
	];
}
