"use client";

import type { FilterFn } from "@tanstack/react-table";
import { Download, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { Button } from "@/components/ui/button";
import { downloadCsv, toCsv } from "@/lib/csv";
import type { Expense, ExpenseCategory } from "@/types";
import { useExpensesController } from "../hooks/use-expenses";
import { ExpenseFormDialog } from "./expense-form-dialog";
import {
	EXPENSE_STATUS_LABELS,
	EXPENSE_TYPE_LABELS,
} from "./expense-form-schema";
import { buildExpenseColumns } from "./expense-table-columns";
import { ExpenseVoidDialog } from "./expense-void-dialog";

const globalFilterFn: FilterFn<Expense> = (row, _columnId, value) => {
	const search = String(value).toLowerCase();
	const { description, supplier, paymentMethod, invoiceRef } = row.original;
	return `${description} ${supplier ?? ""} ${paymentMethod} ${invoiceRef ?? ""}`
		.toLowerCase()
		.includes(search);
};

interface ExpenseTableProps {
	initialExpenses: Expense[];
	categories: ExpenseCategory[];
}

export function ExpenseTable({
	initialExpenses,
	categories,
}: ExpenseTableProps) {
	const { expenses, addExpense, updateExpense, voidExpense, isPending } =
		useExpensesController(initialExpenses);

	const [formOpen, setFormOpen] = useState(false);
	const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
	const [expenseToVoid, setExpenseToVoid] = useState<Expense | null>(null);
	// Cambia en cada apertura para forzar el remount de `ExpenseFormDialog` (ver su JSDoc).
	const [formSessionId, setFormSessionId] = useState(0);

	const categoryName = (id: string) =>
		categories.find((c) => c.id === id)?.name ?? "Sin categoría";

	const handleExportCsv = () => {
		const header = [
			"Fecha",
			"Descripción",
			"Categoría",
			"Valor",
			"Proveedor",
			"Método de pago",
			"Factura",
			"Tipo",
			"Estado",
		];
		const rows = expenses.map((expense) => [
			expense.date,
			expense.description,
			categoryName(expense.categoryId),
			String(expense.amount),
			expense.supplier ?? "",
			expense.paymentMethod,
			expense.invoiceRef ?? "",
			EXPENSE_TYPE_LABELS[expense.type],
			EXPENSE_STATUS_LABELS[expense.status],
		]);
		downloadCsv(
			`gastos-${new Date().toISOString().slice(0, 10)}.csv`,
			toCsv([header, ...rows]),
		);
	};

	const columns = useMemo(
		() =>
			buildExpenseColumns({
				categories,
				onEdit: (expense) => {
					setEditingExpense(expense);
					setFormSessionId((id) => id + 1);
					setFormOpen(true);
				},
				onVoid: setExpenseToVoid,
				isPending,
			}),
		[categories, isPending],
	);

	return (
		<div className="flex flex-col gap-4">
			<DataTable
				columns={columns}
				data={expenses}
				searchPlaceholder="Buscar por descripción, proveedor o factura..."
				globalFilterFn={globalFilterFn}
				emptyMessage="No hay gastos registrados."
				toolbarActions={
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleExportCsv}
							disabled={expenses.length === 0}
						>
							<Download className="size-4" />
							Exportar CSV
						</Button>
						<PermissionGuard module="gastos" action="crear">
							<Button
								type="button"
								size="sm"
								disabled={isPending}
								onClick={() => {
									setEditingExpense(null);
									setFormSessionId((id) => id + 1);
									setFormOpen(true);
								}}
							>
								<Plus className="size-4" />
								Nuevo gasto
							</Button>
						</PermissionGuard>
					</div>
				}
			/>

			<ExpenseFormDialog
				key={formSessionId}
				open={formOpen}
				onOpenChange={setFormOpen}
				expense={editingExpense}
				categories={categories}
				isPending={isPending}
				onSubmit={(values) => {
					if (editingExpense) {
						updateExpense(editingExpense.id, values);
					} else {
						addExpense(values);
					}
				}}
			/>

			<ExpenseVoidDialog
				expense={expenseToVoid}
				onOpenChange={(open) => !open && setExpenseToVoid(null)}
				isPending={isPending}
				onConfirm={(id, reason) => {
					voidExpense(id, reason);
					setExpenseToVoid(null);
				}}
			/>
		</div>
	);
}
