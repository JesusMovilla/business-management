import { create } from "zustand";
import { productsMock } from "@/modules/inventario/mock-data/products.mock";
import type { NewProductInput, Product } from "@/types";

interface ProductState {
	products: Product[];
	addProduct: (input: NewProductInput) => string;
	updateProduct: (id: string, patch: Partial<NewProductInput>) => void;
	removeProduct: (id: string) => void;
}

function nowIso() {
	return new Date(2026, 0, 1).toISOString();
}

export const useProductStore = create<ProductState>((set) => ({
	products: productsMock,

	addProduct: (input) => {
		const id = `prod-${Math.random().toString(36).slice(2, 10)}`;
		const newProduct: Product = {
			...input,
			id,
			createdAt: nowIso(),
			updatedAt: nowIso(),
		};
		set((state) => ({ products: [...state.products, newProduct] }));
		return id;
	},

	updateProduct: (id, patch) => {
		set((state) => ({
			products: state.products.map((product) =>
				product.id === id
					? { ...product, ...patch, updatedAt: nowIso() }
					: product,
			),
		}));
	},

	removeProduct: (id) => {
		set((state) => ({
			products: state.products.filter((product) => product.id !== id),
		}));
	},
}));
