import { Plus } from "lucide-react";
import Link from "next/link";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { Button } from "@/components/ui/button";
import { ProductTable } from "@/modules/inventario/components/product-table";

export default function InventarioPage() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">Inventario</h1>
					<p className="text-muted-foreground text-sm">
						Gestiona el catálogo de productos, stock y precios.
					</p>
				</div>
				<PermissionGuard module="inventario" action="crear">
					<Button render={<Link href="/inventario/nuevo" />}>
						<Plus className="size-4" />
						Nuevo producto
					</Button>
				</PermissionGuard>
			</div>
			<ProductTable />
		</div>
	);
}
