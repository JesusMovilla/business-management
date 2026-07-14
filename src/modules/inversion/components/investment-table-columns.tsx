"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Ban, Pencil } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
	DataTableRowActions,
	type RowAction,
} from "@/components/data-table/data-table-row-actions";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import type { Investment, InvestmentGroup } from "@/types";
import { INVESTMENT_STATUS_LABELS } from "./investment-form-schema";

interface BuildInvestmentColumnsArgs {
	groups: InvestmentGroup[];
	onEdit: (investment: Investment) => void;
	onVoid: (investment: Investment) => void;
	isPending?: boolean;
}

const STATUS_BADGE_VARIANT: Record<
	Investment["status"],
	"default" | "destructive"
> = {
	activa: "default",
	anulada: "destructive",
};

export function buildInvestmentColumns({
	groups,
	onEdit,
	onVoid,
	isPending,
}: BuildInvestmentColumnsArgs): ColumnDef<Investment>[] {
	const groupName = (id: string) =>
		groups.find((g) => g.id === id)?.name ?? "—";

	return [
		{
			id: "actions",
			header: "",
			enableHiding: false,
			cell: ({ row }) => {
				const investment = row.original;
				const isVoided = investment.status === "anulada";
				const actions: RowAction[] = [
					{
						label: "Editar",
						icon: Pencil,
						onClick: () => onEdit(investment),
						permission: { module: "inversion", action: "editar" },
						disabled: isPending || isVoided,
					},
					{
						label: "Anular",
						icon: Ban,
						variant: "destructive",
						onClick: () => onVoid(investment),
						permission: { module: "inversion", action: "eliminar" },
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
			accessorKey: "description",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Descripción" />
			),
			meta: { title: "Descripción" },
			cell: ({ row }) => (
				<span className="font-medium">{row.original.description}</span>
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
						options: Object.entries(INVESTMENT_STATUS_LABELS).map(
							([value, label]) => ({ label, value }),
						),
					}}
				/>
			),
			meta: { title: "Estado" },
			filterFn: "arrIncludesSome",
			cell: ({ row }) => (
				<Badge variant={STATUS_BADGE_VARIANT[row.original.status]}>
					{INVESTMENT_STATUS_LABELS[row.original.status]}
				</Badge>
			),
		},
	];
}
