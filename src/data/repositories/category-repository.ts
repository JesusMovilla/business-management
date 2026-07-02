import { useCatalogStore } from "@/stores/catalog-store";
import type { Category } from "@/types";

export const categoryRepository = {
	async list(): Promise<Category[]> {
		return useCatalogStore.getState().categories;
	},
	async create(input: Omit<Category, "id">): Promise<string> {
		return useCatalogStore.getState().addCategory(input);
	},
	async update(
		id: string,
		patch: Partial<Omit<Category, "id">>,
	): Promise<void> {
		useCatalogStore.getState().updateCategory(id, patch);
	},
	async remove(id: string): Promise<void> {
		useCatalogStore.getState().removeCategory(id);
	},
};
