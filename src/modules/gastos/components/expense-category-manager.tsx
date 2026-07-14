"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { PermissionGuard } from "@/components/guards/permission-guard";
import type { ExpenseCategory } from "@/types";
import { useExpenseCategoriesController } from "../hooks/use-expense-categories";
import { ExpenseCategoryFormDialog } from "./expense-category-form";
import { buildExpenseCategoryColumns } from "./expense-category-table-columns";

export function ExpenseCategoryManager({
	initialCategories,
}: {
	initialCategories: ExpenseCategory[];
}) {
	const { categories, addCategory, removeCategory, isPending } =
		useExpenseCategoriesController(initialCategories);

	const columns = useMemo(
		() =>
			buildExpenseCategoryColumns({
				categories,
				onDelete: removeCategory,
				isPending,
			}),
		[categories, removeCategory, isPending],
	);

	return (
		<DataTable
			columns={columns}
			data={categories}
			emptyMessage="No hay categorías de gasto."
			toolbarActions={
				<PermissionGuard module="gastos" action="crear">
					<ExpenseCategoryFormDialog
						categories={categories}
						onCreated={addCategory}
					/>
				</PermissionGuard>
			}
		/>
	);
}
