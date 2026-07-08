import { RouteGuard } from "@/components/guards/route-guard";
import { productRepository } from "@/data/repositories/product-repository";
import { CashClosingForm } from "@/modules/cierre-caja/components/cash-closing-form";

export default async function NuevoCierrePage() {
	const products = await productRepository.listWithQuantity();

	return (
		<RouteGuard module="cierre-caja" action="crear">
			<CashClosingForm mode="create" products={products} />
		</RouteGuard>
	);
}
