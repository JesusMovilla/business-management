import type { ReactNode } from "react";
import { categoryRepository } from "@/data/repositories/category-repository";
import { productRepository } from "@/data/repositories/product-repository";
import { stockMovementRepository } from "@/data/repositories/stock-movement-repository";
import { userRepository } from "@/data/repositories/user-repository";
import { InventoryProvider } from "@/modules/inventario/inventory-provider";

// Inventario vive en Postgres real: se recarga por request, no es un snapshot de build.
export const dynamic = "force-dynamic";

export default async function InventarioLayout({
	children,
}: {
	children: ReactNode;
}) {
	const [products, categories, movements, users] = await Promise.all([
		productRepository.listWithQuantity(),
		categoryRepository.list(),
		stockMovementRepository.listAll(),
		userRepository.list(),
	]);

	return (
		<InventoryProvider
			initialProducts={products}
			initialCategories={categories}
			initialMovements={movements}
			users={users.map((user) => ({ id: user.id, fullName: user.fullName }))}
		>
			{children}
		</InventoryProvider>
	);
}
