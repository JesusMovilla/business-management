import { create } from "zustand";
import { stockMovementsMock } from "@/modules/inventario/mock-data/stock-movements.mock";
import type { StockMovement } from "@/types";

interface StockMovementState {
	movements: StockMovement[];
	addMovement: (input: Omit<StockMovement, "id">) => string;
}

/** Ledger de movimientos de stock, append-only: no hay `update`/`remove`, es un historial. */
export const useStockMovementStore = create<StockMovementState>((set) => ({
	movements: stockMovementsMock,

	addMovement: (input) => {
		const id = `mov-${Math.random().toString(36).slice(2, 10)}`;
		set((state) => ({ movements: [...state.movements, { ...input, id }] }));
		return id;
	},
}));
