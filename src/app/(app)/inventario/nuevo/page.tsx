import { RouteGuard } from "@/components/guards/route-guard";
import { ProductForm } from "@/modules/inventario/components/product-form";

export default function NuevoProductoPage() {
	return (
		<RouteGuard module="inventario" action="crear">
			<div className="flex flex-col gap-6">
				<div>
					<h1 className="text-2xl font-semibold">Nuevo producto</h1>
					<p className="text-muted-foreground text-sm">
						Registra un nuevo producto en el inventario.
					</p>
				</div>
				<ProductForm mode="create" />
			</div>
		</RouteGuard>
	);
}
