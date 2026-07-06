"use client";

import { useCallback, useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { toast } from "@/lib/toast";
import { useSupplierMutations, useSuppliers } from "../hooks/use-products";
import { SupplierFormDialog } from "./supplier-form";
import { buildSupplierColumns } from "./supplier-table-columns";

export function SupplierManager() {
	const suppliers = useSuppliers();
	const { removeSupplier } = useSupplierMutations();
	const [pendingId, setPendingId] = useState<string | null>(null);

	const handleDelete = useCallback(
		async (supplierId: string) => {
			setPendingId(supplierId);
			try {
				await toast.promise(removeSupplier(supplierId), {
					loading: "Eliminando proveedor...",
					success: "Proveedor eliminado.",
					error: (err) =>
						err instanceof Error
							? err.message
							: "No se pudo eliminar el proveedor.",
				});
			} catch {
				// El toast ya mostró el error.
			} finally {
				setPendingId(null);
			}
		},
		[removeSupplier],
	);

	const columns = useMemo(
		() => buildSupplierColumns({ onDelete: handleDelete, pendingId }),
		[handleDelete, pendingId],
	);

	return (
		<DataTable
			columns={columns}
			data={suppliers}
			emptyMessage="No hay proveedores."
			toolbarActions={
				<PermissionGuard module="inventario" action="crear">
					<SupplierFormDialog onCreated={() => {}} />
				</PermissionGuard>
			}
		/>
	);
}
