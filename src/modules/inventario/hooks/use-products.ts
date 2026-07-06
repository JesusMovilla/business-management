"use client";

import { useMemo } from "react";
import type { NewProductInput, ProductWithMargin } from "@/types";
import {
	createCategoryAction,
	createProductAction,
	removeCategoryAction,
	removeProductAction,
	updateProductAction,
} from "../actions";
import { useInventoryContext } from "../inventory-provider";
import { calcRetailMargin } from "../lib/calc-margin";
import { getStockStatus } from "../lib/stock-status";

export function useProducts(): ProductWithMargin[] {
	const { state } = useInventoryContext();
	return useMemo(
		() =>
			state.products.map((product) => ({
				...product,
				marginRetail: calcRetailMargin(product.pricing),
				stockStatus: getStockStatus(product.stock),
			})),
		[state.products],
	);
}

export function useProduct(id: string): ProductWithMargin | undefined {
	const products = useProducts();
	return useMemo(
		() => products.find((product) => product.id === id),
		[products, id],
	);
}

/** Lanza con el mensaje de la Server Action si falló — el llamador lo muestra vía `toast.promise`. */
function assertSuccess(
	result: { success: true } | { success: false; error: string },
	fallback: string,
): void {
	if (!result.success) throw new Error(result.error || fallback);
}

export function useProductMutations() {
	const { applyOptimistic, startTransition } = useInventoryContext();

	const addProduct = async (
		input: NewProductInput,
		initialQuantity: number,
	): Promise<string> => {
		const result = await createProductAction(input, initialQuantity);
		assertSuccess(result, "No se pudo crear el producto.");
		if (!result.id) throw new Error("No se pudo crear el producto.");
		const now = new Date().toISOString();
		startTransition(() => {
			applyOptimistic({
				type: "add-product",
				product: {
					...input,
					id: result.id as string,
					createdAt: now,
					updatedAt: now,
					stock: { ...input.stock, quantity: initialQuantity },
				},
			});
		});
		return result.id;
	};

	const updateProduct = async (
		id: string,
		patch: Partial<NewProductInput>,
	): Promise<void> => {
		const result = await updateProductAction(id, patch);
		assertSuccess(result, "No se pudo actualizar el producto.");
		startTransition(() => {
			applyOptimistic({ type: "update-product", id, patch });
		});
	};

	const removeProduct = async (id: string): Promise<void> => {
		const result = await removeProductAction(id);
		assertSuccess(result, "No se pudo eliminar el producto.");
		startTransition(() => {
			applyOptimistic({ type: "remove-product", id });
		});
	};

	return { addProduct, updateProduct, removeProduct };
}

export type { NewProductInput };

export function useCategories() {
	const { state } = useInventoryContext();
	return state.categories;
}

export function useCategoryMutations() {
	const { applyOptimistic, startTransition } = useInventoryContext();

	const addCategory = async (input: {
		name: string;
		description?: string;
	}): Promise<string> => {
		const result = await createCategoryAction(input);
		assertSuccess(result, "No se pudo crear la categoría.");
		if (!result.id) throw new Error("No se pudo crear la categoría.");
		startTransition(() => {
			applyOptimistic({
				type: "add-category",
				category: { ...input, id: result.id as string },
			});
		});
		return result.id;
	};

	const removeCategory = async (id: string): Promise<void> => {
		const result = await removeCategoryAction(id);
		assertSuccess(result, "No se pudo eliminar la categoría.");
		startTransition(() => {
			applyOptimistic({ type: "remove-category", id });
		});
	};

	return { addCategory, removeCategory };
}
