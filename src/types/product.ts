export interface ProductPricing {
	cost: number;
	retailPrice: number;
	wholesalePrice: number;
}

/**
 * `quantity` no vive acá: es un valor derivado (suma de `StockMovement.delta` del producto),
 * nunca se guarda directamente. Ver `useProducts()` y `docs/DECISIONS.md`.
 */
export interface ProductStock {
	minStock: number;
	warehouseLocation: string;
}

export type ProductCategoryId = string;

export interface Product {
	id: string;
	sku: string;
	name: string;
	brand: string;
	categoryId: ProductCategoryId;
	presentation: string;
	volumeMl?: number;
	stock: ProductStock;
	pricing: ProductPricing;
	supplierId: string;
	lastPurchaseDate?: string;
	imageUrl?: string;
	active: boolean;
	createdAt: string;
	updatedAt: string;
}

export type StockStatus = "ok" | "bajo" | "critico";

export interface ProductWithMargin extends Omit<Product, "stock"> {
	stock: ProductStock & { quantity: number };
	marginRetail: number;
	marginWholesale: number;
	stockStatus: StockStatus;
}

export type NewProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;
