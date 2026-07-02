import { create } from "zustand";
import { categoriesMock } from "@/modules/inventario/mock-data/categories.mock";
import { suppliersMock } from "@/modules/inventario/mock-data/suppliers.mock";
import type { Category, Supplier } from "@/types";

interface CatalogState {
	categories: Category[];
	suppliers: Supplier[];
	addCategory: (input: Omit<Category, "id">) => string;
	updateCategory: (id: string, patch: Partial<Omit<Category, "id">>) => void;
	removeCategory: (id: string) => void;
	addSupplier: (input: Omit<Supplier, "id">) => string;
	updateSupplier: (id: string, patch: Partial<Omit<Supplier, "id">>) => void;
	removeSupplier: (id: string) => void;
}

export const useCatalogStore = create<CatalogState>((set) => ({
	categories: categoriesMock,
	suppliers: suppliersMock,

	addCategory: (input) => {
		const id = `cat-${Math.random().toString(36).slice(2, 10)}`;
		set((state) => ({ categories: [...state.categories, { ...input, id }] }));
		return id;
	},

	updateCategory: (id, patch) => {
		set((state) => ({
			categories: state.categories.map((category) =>
				category.id === id ? { ...category, ...patch } : category,
			),
		}));
	},

	removeCategory: (id) => {
		set((state) => ({
			categories: state.categories.filter((category) => category.id !== id),
		}));
	},

	addSupplier: (input) => {
		const id = `sup-${Math.random().toString(36).slice(2, 10)}`;
		set((state) => ({ suppliers: [...state.suppliers, { ...input, id }] }));
		return id;
	},

	updateSupplier: (id, patch) => {
		set((state) => ({
			suppliers: state.suppliers.map((supplier) =>
				supplier.id === id ? { ...supplier, ...patch } : supplier,
			),
		}));
	},

	removeSupplier: (id) => {
		set((state) => ({
			suppliers: state.suppliers.filter((supplier) => supplier.id !== id),
		}));
	},
}));
