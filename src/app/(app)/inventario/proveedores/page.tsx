import { SupplierManager } from "@/modules/inventario/components/supplier-manager";

export default function ProveedoresInventarioPage() {
	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-semibold">Proveedores</h1>
				<p className="text-muted-foreground text-sm">
					Gestiona los proveedores de tu inventario.
				</p>
			</div>
			<SupplierManager />
		</div>
	);
}
