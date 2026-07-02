"use client";

import { Trash2 } from "lucide-react";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useCatalogStore } from "@/stores/catalog-store";
import { SupplierFormDialog } from "./supplier-form";

export function SupplierManager() {
	const suppliers = useCatalogStore((state) => state.suppliers);
	const removeSupplier = useCatalogStore((state) => state.removeSupplier);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-end">
				<PermissionGuard module="inventario" action="crear">
					<SupplierFormDialog onCreated={() => {}} />
				</PermissionGuard>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nombre</TableHead>
							<TableHead>Contacto</TableHead>
							<TableHead>Teléfono</TableHead>
							<TableHead>Email</TableHead>
							<TableHead className="w-10" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{suppliers.map((supplier) => (
							<TableRow key={supplier.id}>
								<TableCell className="font-medium">{supplier.name}</TableCell>
								<TableCell className="text-muted-foreground">
									{supplier.contactName ?? "—"}
								</TableCell>
								<TableCell className="text-muted-foreground">
									{supplier.phone ?? "—"}
								</TableCell>
								<TableCell className="text-muted-foreground">
									{supplier.email ?? "—"}
								</TableCell>
								<TableCell>
									<PermissionGuard module="inventario" action="eliminar">
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={() => removeSupplier(supplier.id)}
										>
											<Trash2 className="size-4" />
										</Button>
									</PermissionGuard>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
