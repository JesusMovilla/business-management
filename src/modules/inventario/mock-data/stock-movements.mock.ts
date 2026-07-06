import type { StockMovement } from "@/types";

const SEED_DATE = "2026-01-01T00:00:00.000Z";

const INITIAL_QUANTITIES: Record<string, number> = {
	"prod-1": 480,
	"prod-2": 60,
	"prod-3": 24,
	"prod-4": 8,
	"prod-5": 35,
	"prod-6": 4,
	"prod-7": 42,
	"prod-8": 90,
	"prod-9": 18,
};

/**
 * Un movimiento "entrada" semilla por producto, reflejando la cantidad que ya tenían en el mock
 * anterior. `userId` se resuelve al sembrar (`src/db/seed.ts`) contra el super admin real — el
 * ledger no acepta un usuario que no exista en la tabla `user`.
 */
export function buildStockMovementsMock(userId: string): StockMovement[] {
	return Object.entries(INITIAL_QUANTITIES).map(([productId, quantity]) => ({
		id: `mov-seed-${productId}`,
		productId,
		type: "entrada",
		delta: quantity,
		date: SEED_DATE,
		note: "Stock inicial",
		userId,
	}));
}
