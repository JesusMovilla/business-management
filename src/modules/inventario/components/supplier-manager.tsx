"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { useCatalogStore } from "@/stores/catalog-store";
import { SupplierFormDialog } from "./supplier-form";
import { buildSupplierColumns } from "./supplier-table-columns";

export function SupplierManager() {
	const suppliers = useCatalogStore((state) => state.suppliers);
	const removeSupplier = useCatalogStore((state) => state.removeSupplier);

	const columns = useMemo(
		() => buildSupplierColumns(removeSupplier),
		[removeSupplier],
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
