"use client";

import { useMemo } from "react";
import { toast } from "@/lib/toast";
import type { NewProductInput, ProductWithMargin } from "@/types";
import {
	createCategoryAction,
	createProductAction,
	createSupplierAction,
	removeCategoryAction,
	removeProductAction,
	removeSupplierAction,
	updateProductAction,
} from "../actions";
import { useInventoryContext } from "../inventory-provider";
import { calcRetailMargin, calcWholesaleMargin } from "../lib/calc-margin";
import { getStockStatus } from "../lib/stock-status";

export function useProducts(): ProductWithMargin[] {
	const { state } = useInventoryContext();
	return useMemo(
		() =>
			state.products.map((product) => ({
				...product,
				marginRetail: calcRetailMargin(product.pricing),
				marginWholesale: calcWholesaleMargin(product.pricing),
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

export function useProductMutations() {
	const { applyOptimistic, startTransition } = useInventoryContext();

	const addProduct = async (
		input: NewProductInput,
		initialQuantity: number,
	): Promise<string | null> => {
		const result = await createProductAction(input, initialQuantity);
		if (!result.success || !result.id) {
			toast.error(
				!result.success ? result.error : "No se pudo crear el producto.",
			);
			return null;
		}
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
	): Promise<boolean> => {
		const result = await updateProductAction(id, patch);
		if (!result.success) {
			toast.error(result.error);
			return false;
		}
		startTransition(() => {
			applyOptimistic({ type: "update-product", id, patch });
		});
		return true;
	};

	const removeProduct = async (id: string): Promise<boolean> => {
		const result = await removeProductAction(id);
		if (!result.success) {
			toast.error(result.error);
			return false;
		}
		startTransition(() => {
			applyOptimistic({ type: "remove-product", id });
		});
		return true;
	};

	return { addProduct, updateProduct, removeProduct };
}

export function useSkuExists() {
	const { state } = useInventoryContext();
	return (sku: string, excludeId?: string) =>
		state.products.some(
			(product) =>
				product.sku.toLowerCase() === sku.toLowerCase() &&
				product.id !== excludeId,
		);
}

export type { NewProductInput };

export function useCategories() {
	const { state } = useInventoryContext();
	return state.categories;
}

export function useSuppliers() {
	const { state } = useInventoryContext();
	return state.suppliers;
}

export function useCategoryMutations() {
	const { applyOptimistic, startTransition } = useInventoryContext();

	const addCategory = async (input: {
		name: string;
		description?: string;
	}): Promise<string | null> => {
		const result = await createCategoryAction(input);
		if (!result.success || !result.id) {
			toast.error(
				!result.success ? result.error : "No se pudo crear la categoría.",
			);
			return null;
		}
		startTransition(() => {
			applyOptimistic({
				type: "add-category",
				category: { ...input, id: result.id as string },
			});
		});
		return result.id;
	};

	const removeCategory = async (id: string): Promise<boolean> => {
		const result = await removeCategoryAction(id);
		if (!result.success) {
			toast.error(result.error);
			return false;
		}
		startTransition(() => {
			applyOptimistic({ type: "remove-category", id });
		});
		return true;
	};

	return { addCategory, removeCategory };
}

export function useSupplierMutations() {
	const { applyOptimistic, startTransition } = useInventoryContext();

	const addSupplier = async (input: {
		name: string;
		contactName?: string;
		phone?: string;
		email?: string;
		address?: string;
		notes?: string;
	}): Promise<string | null> => {
		const result = await createSupplierAction(input);
		if (!result.success || !result.id) {
			toast.error(
				!result.success ? result.error : "No se pudo crear el proveedor.",
			);
			return null;
		}
		startTransition(() => {
			applyOptimistic({
				type: "add-supplier",
				supplier: { ...input, id: result.id as string },
			});
		});
		return result.id;
	};

	const removeSupplier = async (id: string): Promise<boolean> => {
		const result = await removeSupplierAction(id);
		if (!result.success) {
			toast.error(result.error);
			return false;
		}
		startTransition(() => {
			applyOptimistic({ type: "remove-supplier", id });
		});
		return true;
	};

	return { addSupplier, removeSupplier };
}
