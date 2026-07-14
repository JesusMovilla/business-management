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
import type { Expense, ExpenseCategory } from "@/types";
import {
	EXPENSE_STATUS_LABELS,
	EXPENSE_TYPE_LABELS,
} from "./expense-form-schema";

interface BuildExpenseColumnsArgs {
	categories: ExpenseCategory[];
	onEdit: (expense: Expense) => void;
	onVoid: (expense: Expense) => void;
	isPending?: boolean;
}

const STATUS_BADGE_VARIANT: Record<
	Expense["status"],
	"default" | "secondary" | "destructive"
> = {
	pagado: "default",
	pendiente: "secondary",
	anulado: "destructive",
};

export function buildExpenseColumns({
	categories,
	onEdit,
	onVoid,
	isPending,
}: BuildExpenseColumnsArgs): ColumnDef<Expense>[] {
	const categoryName = (id: string) =>
		categories.find((c) => c.id === id)?.name ?? "—";

	return [
		{
			id: "actions",
			header: "",
			enableHiding: false,
			cell: ({ row }) => {
				const expense = row.original;
				const isVoided = expense.status === "anulado";
				const actions: RowAction[] = [
					{
						label: "Editar",
						icon: Pencil,
						onClick: () => onEdit(expense),
						permission: { module: "gastos", action: "editar" },
						disabled: isPending || isVoided,
					},
					{
						label: "Anular",
						icon: Ban,
						variant: "destructive",
						onClick: () => onVoid(expense),
						permission: { module: "gastos", action: "eliminar" },
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
				<div className="flex flex-col">
					<span className="font-medium">{row.original.description}</span>
					{row.original.supplier && (
						<span className="text-muted-foreground text-xs">
							{row.original.supplier}
						</span>
					)}
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
			accessorKey: "amount",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Valor" />
			),
			meta: { title: "Valor" },
			cell: ({ row }) => formatCurrency(row.original.amount),
		},
		{
			accessorKey: "paymentMethod",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Método de pago"
					filter={{ type: "text" }}
				/>
			),
			meta: { title: "Método de pago" },
			filterFn: "includesString",
		},
		{
			accessorKey: "type",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Tipo"
					filter={{
						type: "select",
						options: Object.entries(EXPENSE_TYPE_LABELS).map(
							([value, label]) => ({
								label,
								value,
							}),
						),
					}}
				/>
			),
			meta: { title: "Tipo" },
			filterFn: "arrIncludesSome",
			cell: ({ row }) => EXPENSE_TYPE_LABELS[row.original.type],
		},
		{
			accessorKey: "status",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Estado"
					filter={{
						type: "select",
						options: Object.entries(EXPENSE_STATUS_LABELS).map(
							([value, label]) => ({ label, value }),
						),
					}}
				/>
			),
			meta: { title: "Estado" },
			filterFn: "arrIncludesSome",
			cell: ({ row }) => (
				<Badge variant={STATUS_BADGE_VARIANT[row.original.status]}>
					{EXPENSE_STATUS_LABELS[row.original.status]}
				</Badge>
			),
		},
	];
}
