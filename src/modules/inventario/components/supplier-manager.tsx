"use client";

import { useCallback, useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { toast } from "@/lib/toast";
import { useCatalogStore } from "@/stores/catalog-store";
import { SupplierFormDialog } from "./supplier-form";
import { buildSupplierColumns } from "./supplier-table-columns";

export function SupplierManager() {
	const suppliers = useCatalogStore((state) => state.suppliers);
	const removeSupplier = useCatalogStore((state) => state.removeSupplier);

	const handleDelete = useCallback(
		(supplierId: string) => {
			removeSupplier(supplierId);
			toast.success("Proveedor eliminado.");
		},
		[removeSupplier],
	);

	const columns = useMemo(
		() => buildSupplierColumns(handleDelete),
		[handleDelete],
	);

	return (
		<DataTable
			columns={columns}
			data={suppliers}
			emptyMessage="No hay proveedores."
			toolbarActions={
				<PermissionGuard module="inventario" action="crear">
					<SupplierFormDialog
						onCreated={() => toast.success("Proveedor creado.")}
					/>
				</PermissionGuard>
			}
		/>
	);
}
