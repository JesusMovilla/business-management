"use client";

import { useMemo } from "react";
import { useCatalogStore } from "@/stores/catalog-store";
import { useProductStore } from "@/stores/product-store";
import type { NewProductInput, ProductWithMargin } from "@/types";
import { calcRetailMargin, calcWholesaleMargin } from "../lib/calc-margin";
import { getStockStatus } from "../lib/stock-status";
import {
	useAllMovements,
	useStockMovementMutations,
} from "./use-stock-movements";

export function useProducts(): ProductWithMargin[] {
	const products = useProductStore((state) => state.products);
	const movements = useAllMovements();
	return useMemo(() => {
		const quantityByProduct = new Map<string, number>();
		for (const movement of movements) {
			quantityByProduct.set(
				movement.productId,
				(quantityByProduct.get(movement.productId) ?? 0) + movement.delta,
			);
		}
		return products.map((product) => {
			const stock = {
				...product.stock,
				quantity: quantityByProduct.get(product.id) ?? 0,
			};
			return {
				...product,
				stock,
				marginRetail: calcRetailMargin(product.pricing),
				marginWholesale: calcWholesaleMargin(product.pricing),
				stockStatus: getStockStatus(stock),
			};
		});
	}, [products, movements]);
}

export function useProduct(id: string): ProductWithMargin | undefined {
	const products = useProducts();
	return useMemo(
		() => products.find((product) => product.id === id),
		[products, id],
	);
}

export function useProductMutations() {
	const addProductToStore = useProductStore((state) => state.addProduct);
	const updateProduct = useProductStore((state) => state.updateProduct);
	const removeProduct = useProductStore((state) => state.removeProduct);
	const { registerEntrada } = useStockMovementMutations();

	const addProduct = (input: NewProductInput, initialQuantity: number) => {
		const id = addProductToStore(input);
		if (initialQuantity > 0) {
			registerEntrada(id, initialQuantity, "Alta inicial de producto");
		}
		return id;
	};

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
