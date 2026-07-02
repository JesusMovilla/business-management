"use client";

import { useMemo } from "react";
import { useCatalogStore } from "@/stores/catalog-store";
import { useProductStore } from "@/stores/product-store";
import type { NewProductInput, ProductWithMargin } from "@/types";
import { calcRetailMargin, calcWholesaleMargin } from "../lib/calc-margin";
import { getStockStatus } from "../lib/stock-status";

export function useProducts(): ProductWithMargin[] {
	const products = useProductStore((state) => state.products);
	return useMemo(
		() =>
			products.map((product) => ({
				...product,
				marginRetail: calcRetailMargin(product.pricing),
				marginWholesale: calcWholesaleMargin(product.pricing),
				stockStatus: getStockStatus(product.stock),
			})),
		[products],
	);
}

export function useProduct(id: string): ProductWithMargin | undefined {
	const products = useProducts();
	return useMemo(
		() => products.find((product) => product.id === id),
		[products, id],
	);
}

export function useProductMutations() {
	const addProduct = useProductStore((state) => state.addProduct);
	const updateProduct = useProductStore((state) => state.updateProduct);
	const removeProduct = useProductStore((state) => state.removeProduct);
	return { addProduct, updateProduct, removeProduct };
}

export function useSkuExists() {
	const products = useProductStore((state) => state.products);
	return (sku: string, excludeId?: string) =>
		products.some(
			(product) =>
				product.sku.toLowerCase() === sku.toLowerCase() &&
				product.id !== excludeId,
		);
}

export type { NewProductInput };

export function useCategories() {
	return useCatalogStore((state) => state.categories);
}

export function useSuppliers() {
	return useCatalogStore((state) => state.suppliers);
}
