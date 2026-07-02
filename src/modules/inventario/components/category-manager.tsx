"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { useCatalogStore } from "@/stores/catalog-store";
import { CategoryFormDialog } from "./category-form";
import { buildCategoryColumns } from "./category-table-columns";

export function CategoryManager() {
	const categories = useCatalogStore((state) => state.categories);
	const removeCategory = useCatalogStore((state) => state.removeCategory);

	const columns = useMemo(
		() => buildCategoryColumns(removeCategory),
		[removeCategory],
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
