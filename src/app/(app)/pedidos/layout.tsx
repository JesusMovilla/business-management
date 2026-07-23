import type { ReactNode } from "react";
import { categoryRepository } from "@/data/repositories/category-repository";
import { productRepository } from "@/data/repositories/product-repository";
import { InventoryProvider } from "@/modules/inventario/inventory-provider";

// Pedidos usa la misma caché de lectura de Inventario para poder crear productos al vuelo
// (`QuickProductDialog`) sin salir del formulario de un pedido. Solo necesita productos y
// categorías (a diferencia de `/inventario/layout.tsx`, no lee movimientos ni usuarios) — ver
// `InventoryProvider`.
export const dynamic = "force-dynamic";

export default async function PedidosLayout({
	children,
}: {
	children: ReactNode;
}) {
	const [products, categories] = await Promise.all([
		productRepository.listWithQuantity(),
		categoryRepository.list(),
	]);

	return (
		<InventoryProvider
			initialProducts={products}
			initialCategories={categories}
		>
			{children}
		</InventoryProvider>
	);
}
