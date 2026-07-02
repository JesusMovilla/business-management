"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ProductWithMargin } from "@/types";
import { useProductFilters } from "../hooks/use-product-filters";
import {
	useCategories,
	useProductMutations,
	useProducts,
	useSuppliers,
} from "../hooks/use-products";
import { ProductFiltersBar } from "./product-filters";
import { buildProductColumns } from "./product-table-columns";

export function ProductTable() {
	const router = useRouter();
	const products = useProducts();
	const categories = useCategories();
	const suppliers = useSuppliers();
	const { filters, setFilters, filtered } = useProductFilters(products);
	const { removeProduct } = useProductMutations();
	const [productToDelete, setProductToDelete] =
		useState<ProductWithMargin | null>(null);

	const columns = useMemo(
		() =>
			buildProductColumns({
				categories,
				suppliers,
				onDelete: setProductToDelete,
			}),
		[categories, suppliers],
	);

	return (
		<div className="flex flex-col gap-4">
			<ProductFiltersBar filters={filters} onChange={setFilters} />
			<DataTable
				columns={columns}
				data={filtered}
				onRowClick={(product) => router.push(`/inventario/${product.id}`)}
				emptyMessage="No se encontraron productos con estos filtros."
			/>
			<AlertDialog
				open={!!productToDelete}
				onOpenChange={(open) => !open && setProductToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Eliminar producto</AlertDialogTitle>
						<AlertDialogDescription>
							¿Seguro que quieres eliminar &quot;{productToDelete?.name}&quot;?
							Esta acción no se puede deshacer.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (productToDelete) removeProduct(productToDelete.id);
								setProductToDelete(null);
							}}
						>
							Eliminar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
