import { RouteGuard } from "@/components/guards/route-guard";
import { PageHeader } from "@/components/layout/page-header";
import { ProductForm } from "@/modules/inventario/components/product-form";

export default function NuevoProductoPage() {
	return (
		<RouteGuard module="inventario" action="crear">
			<div className="flex flex-col gap-6">
				<PageHeader
					title="Nuevo producto"
					description="Registra un nuevo producto en el inventario."
					backHref="/inventario"
				/>
				<ProductForm mode="create" />
			</div>
		</RouteGuard>
	);
}
