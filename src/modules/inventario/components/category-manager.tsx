"use client";

import { useCallback, useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { toast } from "@/lib/toast";
import { useCategories, useCategoryMutations } from "../hooks/use-products";
import { CategoryFormDialog } from "./category-form";
import { buildCategoryColumns } from "./category-table-columns";

export function CategoryManager() {
	const categories = useCategories();
	const { removeCategory } = useCategoryMutations();
	const [pendingId, setPendingId] = useState<string | null>(null);

	const handleDelete = useCallback(
		async (categoryId: string) => {
			setPendingId(categoryId);
			try {
				await toast.promise(removeCategory(categoryId), {
					loading: "Eliminando categoría...",
					success: "Categoría eliminada.",
					error: (err) =>
						err instanceof Error
							? err.message
							: "No se pudo eliminar la categoría.",
				});
			} catch {
				// El toast ya mostró el error.
			} finally {
				setPendingId(null);
			}
		},
		[removeCategory],
	);

	const columns = useMemo(
		() => buildCategoryColumns({ onDelete: handleDelete, pendingId }),
		[handleDelete, pendingId],
	);

	return (
		<DataTable
			columns={columns}
			data={categories}
			emptyMessage="No hay categorías."
			toolbarActions={
				<PermissionGuard module="inventario" action="crear">
					<CategoryFormDialog onCreated={() => {}} />
				</PermissionGuard>
			}
		/>
	);
}
