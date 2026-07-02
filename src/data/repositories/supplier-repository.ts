import { useCatalogStore } from "@/stores/catalog-store";
import type { Supplier } from "@/types";

export const supplierRepository = {
	async list(): Promise<Supplier[]> {
		return useCatalogStore.getState().suppliers;
	},
	async create(input: Omit<Supplier, "id">): Promise<string> {
		return useCatalogStore.getState().addSupplier(input);
	},
	async update(
		id: string,
		patch: Partial<Omit<Supplier, "id">>,
	): Promise<void> {
		useCatalogStore.getState().updateSupplier(id, patch);
	},
	async remove(id: string): Promise<void> {
		useCatalogStore.getState().removeSupplier(id);
	},
};
