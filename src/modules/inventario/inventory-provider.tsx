"use client";

import {
	createContext,
	type ReactNode,
	type TransitionStartFunction,
	use,
	useMemo,
	useOptimistic,
	useTransition,
} from "react";
import type { ProductWithQuantity } from "@/data/repositories/product-repository";
import type { Category, StockMovement } from "@/types";
import {
	type InventoryAction,
	type InventoryState,
	inventoryReducer,
} from "./inventory-reducer";

export interface MovementAuthor {
	id: string;
	fullName: string;
}

interface InventoryContextValue {
	state: InventoryState;
	users: MovementAuthor[];
	applyOptimistic: (action: InventoryAction) => void;
	startTransition: TransitionStartFunction;
	isPending: boolean;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

// Referencias estables para los props opcionales — un `= []` inline crearía un array nuevo en
// cada render y rompería la memoización de `value` (que depende de `users` por referencia).
const EMPTY_MOVEMENTS: StockMovement[] = [];
const EMPTY_USERS: MovementAuthor[] = [];

interface InventoryProviderProps {
	initialProducts: ProductWithQuantity[];
	initialCategories: Category[];
	/** Opcional — solo `/inventario` lo necesita. Otros consumidores (ej. Pedidos) pueden omitirlo. */
	initialMovements?: StockMovement[];
	/** Opcional — solo `/inventario` lo necesita. Otros consumidores (ej. Pedidos) pueden omitirlo. */
	users?: MovementAuthor[];
	children: ReactNode;
}

/**
 * Caché de lectura de Inventario, hidratada una sola vez por request desde
 * `(app)/inventario/layout.tsx` — evita repetir el mismo fetch (productos con cantidad,
 * categorías, movimientos) en cada una de las rutas del módulo, varias de las
 * cuales lo necesitan en componentes anidados 2-3 niveles (ej. `QuickProductDialog` dentro del
 * formulario de un pedido en el módulo Pedidos, que reutiliza este mismo provider). Las
 * mutaciones (`use-products.ts`/`use-stock-movements.ts`) esperan la
 * Server Action correspondiente y solo entonces aplican el cambio confirmado vía
 * `applyOptimistic` (dentro de una transición, como pide `useOptimistic`) — no hay UI especulativa
 * previa a la confirmación del servidor, a diferencia de Contactos, porque este estado se comparte
 * entre muchas rutas y un rollback cruzado sería más complejo que la espera real (rápida, de un
 * solo registro). `initialMovements`/`users` son opcionales porque Pedidos monta este mismo
 * provider solo para `useProducts`/`useCategories`/`useProductMutations` (vía `QuickProductDialog`)
 * — nunca lee movimientos ni usuarios, así que su `layout.tsx` no paga el costo de traer esas dos
 * tablas completas. Ver `docs/DECISIONS.md`.
 */
export function InventoryProvider({
	initialProducts,
	initialCategories,
	initialMovements = EMPTY_MOVEMENTS,
	users = EMPTY_USERS,
	children,
}: InventoryProviderProps) {
	const [isPending, startTransition] = useTransition();
	const [state, applyOptimistic] = useOptimistic(
		{
			products: initialProducts,
			categories: initialCategories,
			movements: initialMovements,
		},
		inventoryReducer,
	);

	const value = useMemo(
		() => ({ state, users, applyOptimistic, startTransition, isPending }),
		[state, users, applyOptimistic, isPending],
	);

	return (
		<InventoryContext.Provider value={value}>
			{children}
		</InventoryContext.Provider>
	);
}

export function useInventoryContext(): InventoryContextValue {
	const context = use(InventoryContext);
	if (!context) {
		throw new Error(
			"useInventoryContext debe usarse dentro de <InventoryProvider>.",
		);
	}
	return context;
}
