"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Ban } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
	DataTableRowActions,
	type RowAction,
} from "@/components/data-table/data-table-row-actions";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import type { InvestmentGroup, ProfitPayout } from "@/types";
import { PROFIT_PAYOUT_STATUS_LABELS } from "./profit-payout-form-schema";

interface BuildProfitPayoutColumnsArgs {
	groups: InvestmentGroup[];
	onVoid: (payout: ProfitPayout) => void;
	isPending?: boolean;
}

const STATUS_BADGE_VARIANT: Record<
	ProfitPayout["status"],
	"default" | "destructive"
> = {
	activo: "default",
	anulado: "destructive",
};

export function buildProfitPayoutColumns({
	groups,
	onVoid,
	isPending,
}: BuildProfitPayoutColumnsArgs): ColumnDef<ProfitPayout>[] {
	const groupName = (id: string) =>
		groups.find((g) => g.id === id)?.name ?? "—";

	return [
		{
			id: "actions",
			header: "",
			enableHiding: false,
			cell: ({ row }) => {
				const payout = row.original;
				const isVoided = payout.status === "anulado";
				const actions: RowAction[] = [
					{
						label: "Anular",
						icon: Ban,
						variant: "destructive",
						onClick: () => onVoid(payout),
						permission: { module: "proyeccion", action: "eliminar" },
						disabled: isPending || isVoided,
					},
				];
				return <DataTableRowActions actions={actions} />;
			},
		},
		{
			accessorKey: "date",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Fecha" />
			),
			meta: { title: "Fecha" },
		},
		{
			accessorKey: "note",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Período / nota" />
			),
			meta: { title: "Período / nota" },
			cell: ({ row }) => (
				<span className="font-medium">{row.original.note}</span>
			),
		},
		{
			accessorKey: "groupId",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Grupo"
					filter={{
						type: "select",
						options: groups.map((g) => ({ label: g.name, value: g.id })),
					}}
				/>
			),
			meta: { title: "Grupo" },
			filterFn: "arrIncludesSome",
			cell: ({ row }) => (
				<Badge variant="secondary">{groupName(row.original.groupId)}</Badge>
			),
		},
		{
			accessorKey: "amount",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Valor" />
			),
			meta: { title: "Valor" },
			cell: ({ row }) => formatCurrency(row.original.amount),
		},
		{
			accessorKey: "status",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Estado"
					filter={{
						type: "select",
						options: Object.entries(PROFIT_PAYOUT_STATUS_LABELS).map(
							([value, label]) => ({ label, value }),
						),
					}}
				/>
			),
			meta: { title: "Estado" },
			filterFn: "arrIncludesSome",
			cell: ({ row }) => (
				<Badge variant={STATUS_BADGE_VARIANT[row.original.status]}>
					{PROFIT_PAYOUT_STATUS_LABELS[row.original.status]}
				</Badge>
			),
		},
	];
}
