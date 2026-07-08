import { RouteGuard } from "@/components/guards/route-guard";
import { productRepository } from "@/data/repositories/product-repository";
import { CashClosingForm } from "@/modules/cierre-caja/components/cash-closing-form";

export default async function NuevoCierrePage() {
	const products = await productRepository.listWithQuantity();

	return (
		<RouteGuard module="cierre-caja" action="crear">
			<div className="flex flex-col gap-6">
				<div>
					<h1 className="text-2xl font-semibold">Nuevo cierre de caja</h1>
					<p className="text-muted-foreground text-sm">
						Registra los productos vendidos hoy y concilia el ingreso esperado.
					</p>
				</div>
				<CashClosingForm mode="create" products={products} />
			</div>
		</RouteGuard>
	);
}
