import { PageHeader } from "@/components/layout/page-header";
import { productRepository } from "@/data/repositories/product-repository";
import { InventoryResetCard } from "@/modules/admin-limpieza/components/inventory-reset-card";

export const dynamic = "force-dynamic";

export default async function AdminLimpiezaPage() {
	const products = await productRepository.listWithQuantity();
	const affectedCount = products.filter(
		(product) => product.stock.quantity !== 0,
	).length;

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Limpieza de datos"
				description="Operaciones destructivas de mantenimiento, exclusivas del Administrador. Cada acción queda registrada en el historial correspondiente."
				backHref="/admin"
			/>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<InventoryResetCard affectedCount={affectedCount} />
			</div>
		</div>
	);
}
