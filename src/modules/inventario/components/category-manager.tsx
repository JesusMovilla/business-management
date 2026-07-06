"use client";

import { useCallback, useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { toast } from "@/lib/toast";
import { useCategories, useCategoryMutations } from "../hooks/use-products";
import { CategoryFormDialog } from "./category-form";
import { buildCategoryColumns } from "./category-table-columns";

export function CategoryManager() {
	const categories = useCategories();
	const { removeCategory } = useCategoryMutations();

	const handleDelete = useCallback(
		async (categoryId: string) => {
			if (await removeCategory(categoryId)) {
				toast.success("Categoría eliminada.");
			}
		},
		[removeCategory],
	);

	const columns = useMemo(
		() => buildCategoryColumns(handleDelete),
		[handleDelete],
	);

	return (
		<DataTable
			columns={columns}
			data={categories}
			emptyMessage="No hay categorías."
			toolbarActions={
				<PermissionGuard module="inventario" action="crear">
					<CategoryFormDialog
						onCreated={() => toast.success("Categoría creada.")}
					/>
				</PermissionGuard>
			}
		/>
	);
}
