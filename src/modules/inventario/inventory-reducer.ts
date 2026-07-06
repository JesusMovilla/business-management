import type { ProductWithQuantity } from "@/data/repositories/product-repository";
import type { Category, NewProductInput, StockMovement } from "@/types";

export interface InventoryState {
	products: ProductWithQuantity[];
	categories: Category[];
	movements: StockMovement[];
}

export type InventoryAction =
	| { type: "add-product"; product: ProductWithQuantity }
	| { type: "update-product"; id: string; patch: Partial<NewProductInput> }
	| { type: "remove-product"; id: string }
	| { type: "add-category"; category: Category }
	| { type: "remove-category"; id: string }
	| { type: "add-movement"; movement: StockMovement }
	| { type: "add-movements"; movements: StockMovement[] };

function mergeProductPatch(
	product: ProductWithQuantity,
	patch: Partial<NewProductInput>,
): ProductWithQuantity {
	return {
		...product,
		...patch,
		stock: { ...product.stock, ...patch.stock },
		pricing: { ...product.pricing, ...patch.pricing },
	};
}

function applyDeltas(
	products: ProductWithQuantity[],
	deltasByProduct: Map<string, number>,
): ProductWithQuantity[] {
	if (deltasByProduct.size === 0) return products;
	return products.map((product) => {
		const delta = deltasByProduct.get(product.id);
		if (!delta) return product;
		return {
			...product,
			stock: { ...product.stock, quantity: product.stock.quantity + delta },
		};
	});
}

export function inventoryReducer(
	state: InventoryState,
	action: InventoryAction,
): InventoryState {
	switch (action.type) {
		case "add-product":
			return { ...state, products: [...state.products, action.product] };
		case "update-product":
			return {
				...state,
				products: state.products.map((product) =>
					product.id === action.id
						? mergeProductPatch(product, action.patch)
						: product,
				),
			};
		case "remove-product":
			return {
				...state,
				products: state.products.filter((product) => product.id !== action.id),
			};
		case "add-category":
			return {
				...state,
				categories: [...state.categories, action.category],
			};
		case "remove-category":
			return {
				...state,
				categories: state.categories.filter(
					(category) => category.id !== action.id,
				),
			};
		case "add-movement":
			return {
				...state,
				products: applyDeltas(
					state.products,
					new Map([[action.movement.productId, action.movement.delta]]),
				),
				movements: [...state.movements, action.movement],
			};
		case "add-movements": {
			const deltasByProduct = new Map<string, number>();
			for (const movement of action.movements) {
				deltasByProduct.set(
					movement.productId,
					(deltasByProduct.get(movement.productId) ?? 0) + movement.delta,
				);
			}
			return {
				...state,
				products: applyDeltas(state.products, deltasByProduct),
				movements: [...state.movements, ...action.movements],
			};
		}
	}
}
