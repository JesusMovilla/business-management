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
} from "../hooks/use-products";
import { buildProductColumns } from "./product-table-columns";

const globalFilterFn: FilterFn<ProductWithMargin> = (row, _columnId, value) => {
	const search = String(value).toLowerCase();
	const { name, brand } = row.original;
	return `${name} ${brand}`.toLowerCase().includes(search);
};

export function ProductTable() {
	const router = useRouter();
	const products = useProducts();
	const categories = useCategories();
	const { removeProduct, restoreProduct } = useProductMutations();
	const [productToDeactivate, setProductToDeactivate] =
		useState<ProductWithMargin | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const columns = useMemo(
		() =>
			buildProductColumns({
				categories,
				onDeactivate: setProductToDeactivate,
				onRestore: async (product) => {
					await toast.promise(restoreProduct(product.id), {
						loading: "Reactivando producto...",
						success: "Producto reactivado.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo reactivar el producto.",
					});
				},
			}),
		[categories, restoreProduct],
	);

	return (
		<div className="flex flex-col gap-4">
			<DataTable
				columns={columns}
				data={products}
				searchPlaceholder="Buscar por nombre o marca..."
				globalFilterFn={globalFilterFn}
				onRowClick={(product) => router.push(`/inventario/${product.id}`)}
				emptyMessage="No se encontraron productos con estos filtros."
			/>
			<AlertDialog
				open={!!productToDeactivate}
				onOpenChange={(open) => !open && setProductToDeactivate(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Desactivar producto</AlertDialogTitle>
						<AlertDialogDescription>
							¿Seguro que quieres desactivar &quot;{productToDeactivate?.name}
							&quot;? Dejará de aparecer para nuevos pedidos y cierres de caja,
							pero se conserva su historial y puedes reactivarlo cuando quieras.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isSubmitting}>
							Cancelar
						</AlertDialogCancel>
						<AlertDialogAction
							disabled={isSubmitting}
							onClick={async () => {
								if (!productToDeactivate) return;
								setIsSubmitting(true);
								try {
									await toast.promise(removeProduct(productToDeactivate.id), {
										loading: "Desactivando producto...",
										success: "Producto desactivado.",
										error: (err) =>
											err instanceof Error
												? err.message
												: "No se pudo desactivar el producto.",
									});
									setProductToDeactivate(null);
								} catch {
									// El toast ya mostró el error; dejamos el diálogo abierto.
								} finally {
									setIsSubmitting(false);
								}
							}}
						>
							Desactivar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
