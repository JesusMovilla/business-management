import type { CashClosing, CashClosingItem, StockMovement } from "@/types";

/**
 * Dos cierres de ejemplo (uno que cuadra, uno con faltante) con sus ítems y los movimientos
 * `venta` correspondientes — así el inventario sembrado queda consistente con las ventas
 * registradas. `userId` se resuelve al sembrar (`src/db/seed.ts`) contra el super admin real.
 */
export function buildCashClosingSeedData(userId: string): {
	closings: CashClosing[];
	items: CashClosingItem[];
	movements: StockMovement[];
} {
	const closingOkDate = "2026-07-05";
	const closingOkAt = `${closingOkDate}T21:30:00.000Z`;
	const closingOk: CashClosing = {
		id: "cc-seed-1",
		date: closingOkDate,
		expectedIncome: 180000,
		actualCash: 180000,
		difference: 0,
		createdBy: userId,
		createdAt: closingOkAt,
		updatedAt: closingOkAt,
	};
	const closingOkItems: CashClosingItem[] = [
		{
			id: "cc-seed-1-item-1",
			cashClosingId: closingOk.id,
			productId: "prod-1",
			quantitySold: 24,
			unitPrice: 3000,
		},
		{
			id: "cc-seed-1-item-2",
			cashClosingId: closingOk.id,
			productId: "prod-8",
			quantitySold: 3,
			unitPrice: 36000,
		},
	];

	const closingShortDate = "2026-07-06";
	const closingShortAt = `${closingShortDate}T21:30:00.000Z`;
	const closingShort: CashClosing = {
		id: "cc-seed-2",
		date: closingShortDate,
		expectedIncome: 142000,
		actualCash: 140000,
		difference: -2000,
		reason: "Se dio mal el vuelto en una venta.",
		createdBy: userId,
		createdAt: closingShortAt,
		updatedAt: closingShortAt,
	};
	const closingShortItems: CashClosingItem[] = [
		{
			id: "cc-seed-2-item-1",
			cashClosingId: closingShort.id,
			productId: "prod-6",
			quantitySold: 2,
			unitPrice: 52000,
		},
		{
			id: "cc-seed-2-item-2",
			cashClosingId: closingShort.id,
			productId: "prod-2",
			quantitySold: 10,
			unitPrice: 3800,
		},
	];

	const items = [...closingOkItems, ...closingShortItems];
	const movements: StockMovement[] = items.map((item) => ({
		id: `mov-seed-venta-${item.id}`,
		productId: item.productId,
		type: "venta",
		delta: -item.quantitySold,
		date:
			item.cashClosingId === closingOk.id
				? closingOk.createdAt
				: closingShort.createdAt,
		userId,
	}));

	return { closings: [closingOk, closingShort], items, movements };
}
