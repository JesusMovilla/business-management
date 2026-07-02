export interface ProductPricing {
	cost: number;
	retailPrice: number;
	wholesalePrice: number;
}

export interface ProductStock {
	quantity: number;
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

export interface ProductWithMargin extends Product {
	marginRetail: number;
	marginWholesale: number;
	stockStatus: StockStatus;
}

export type NewProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;
