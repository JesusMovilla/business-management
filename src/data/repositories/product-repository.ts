import { useProductStore } from "@/stores/product-store";
import type { NewProductInput, Product } from "@/types";

/**
 * Hoy opera en memoria sobre product-store. El contrato async permite
 * reemplazar la implementación por llamadas fetch/API sin tocar consumidores.
 */
export const productRepository = {
	async list(): Promise<Product[]> {
		return useProductStore.getState().products;
	},
	async getById(id: string): Promise<Product | undefined> {
		return useProductStore
			.getState()
			.products.find((product) => product.id === id);
	},
	async create(input: NewProductInput): Promise<string> {
		return useProductStore.getState().addProduct(input);
	},
	async update(id: string, patch: Partial<NewProductInput>): Promise<void> {
		useProductStore.getState().updateProduct(id, patch);
	},
	async remove(id: string): Promise<void> {
		useProductStore.getState().removeProduct(id);
	},
};
