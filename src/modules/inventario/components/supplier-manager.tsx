"use client";

import { useCallback, useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { toast } from "@/lib/toast";
import { useSupplierMutations, useSuppliers } from "../hooks/use-products";
import { SupplierFormDialog } from "./supplier-form";
import { buildSupplierColumns } from "./supplier-table-columns";

export function SupplierManager() {
	const suppliers = useSuppliers();
	const { removeSupplier } = useSupplierMutations();

	const handleDelete = useCallback(
		async (supplierId: string) => {
			if (await removeSupplier(supplierId)) {
				toast.success("Proveedor eliminado.");
			}
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
