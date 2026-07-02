"use client";

import type { FilterFn } from "@tanstack/react-table";
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
import { toast } from "@/lib/toast";
import type { ProductWithMargin } from "@/types";
import {
	useCategories,
	useProductMutations,
	useProducts,
	useSuppliers,
} from "../hooks/use-products";
import { buildProductColumns } from "./product-table-columns";

const globalFilterFn: FilterFn<ProductWithMargin> = (row, _columnId, value) => {
	const search = String(value).toLowerCase();
	const { sku, name, brand } = row.original;
	return `${sku} ${name} ${brand}`.toLowerCase().includes(search);
};

export function ProductTable() {
	const router = useRouter();
	const products = useProducts();
	const categories = useCategories();
	const suppliers = useSuppliers();
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
			<DataTable
				columns={columns}
				data={products}
				searchPlaceholder="Buscar por nombre, SKU o marca..."
				globalFilterFn={globalFilterFn}
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
								if (productToDelete) {
									removeProduct(productToDelete.id);
									toast.success("Producto eliminado.");
								}
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
