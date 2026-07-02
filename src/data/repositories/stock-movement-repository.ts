import { useStockMovementStore } from "@/stores/stock-movement-store";
import type { StockMovement } from "@/types";

export const stockMovementRepository = {
	async list(): Promise<StockMovement[]> {
		return useStockMovementStore.getState().movements;
	},
	async listByProduct(productId: string): Promise<StockMovement[]> {
		return useStockMovementStore
			.getState()
			.movements.filter((movement) => movement.productId === productId);
	},
	async create(input: Omit<StockMovement, "id">): Promise<string> {
		return useStockMovementStore.getState().addMovement(input);
	},
};
