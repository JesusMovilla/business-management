import { desc, eq, sql } from "drizzle-orm";
import { stockMovementRepository } from "@/data/repositories/stock-movement-repository";
import { db } from "@/db/client";
import { cashClosingItems, cashClosings } from "@/db/schema";
import type {
	CashClosing,
	CashClosingItem,
	CashClosingWithItems,
	NewCashClosingInput,
	NewCashClosingItemInput,
	StockMovement,
} from "@/types";

export type CashClosingSummary = CashClosing & { totalQuantitySold: number };

function toCashClosing(row: typeof cashClosings.$inferSelect): CashClosing {
	return {
		id: row.id,
		date: row.date,
		expectedIncome: row.expectedIncome,
		actualCash: row.actualCash,
		difference: row.difference,
		reason: row.reason ?? undefined,
		createdBy: row.createdBy,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		updatedBy: row.updatedBy ?? undefined,
	};
}

function toCashClosingItem(
	row: typeof cashClosingItems.$inferSelect,
): CashClosingItem {
	return {
		id: row.id,
		cashClosingId: row.cashClosingId,
		productId: row.productId,
		quantitySold: row.quantitySold,
		unitPrice: row.unitPrice,
	};
}

export const cashClosingRepository = {
	async listAll(): Promise<CashClosingSummary[]> {
		const rows = await db
			.select({
				closing: cashClosings,
				totalQuantitySold: sql<number>`coalesce(sum(${cashClosingItems.quantitySold}), 0)`,
			})
			.from(cashClosings)
			.leftJoin(
				cashClosingItems,
				eq(cashClosingItems.cashClosingId, cashClosings.id),
			)
			.groupBy(cashClosings.id)
			.orderBy(desc(cashClosings.date));
		return rows.map(({ closing, totalQuantitySold }) => ({
			...toCashClosing(closing),
			totalQuantitySold: Number(totalQuantitySold),
		}));
	},

	async getById(id: string): Promise<CashClosingWithItems | null> {
		const [closing] = await db
			.select()
			.from(cashClosings)
			.where(eq(cashClosings.id, id));
		if (!closing) return null;
		const items = await db
			.select()
			.from(cashClosingItems)
			.where(eq(cashClosingItems.cashClosingId, id));
		return { ...toCashClosing(closing), items: items.map(toCashClosingItem) };
	},

	/** Inserta el cierre, sus ítems y los movimientos `venta` correspondientes — atómico. */
	async create(
		input: NewCashClosingInput,
		items: NewCashClosingItemInput[],
	): Promise<string> {
		const id = crypto.randomUUID();
		await db.transaction(async (tx) => {
			await tx
				.insert(cashClosings)
				.values({ ...input, id, reason: input.reason ?? null });
			if (items.length > 0) {
				await tx.insert(cashClosingItems).values(
					items.map((item) => ({
						...item,
						id: crypto.randomUUID(),
						cashClosingId: id,
					})),
				);
				await stockMovementRepository.createBatch(
					items.map((item) => ({
						productId: item.productId,
						type: "venta",
						delta: -item.quantitySold,
						date: input.createdAt,
						userId: input.createdBy,
					})),
					tx,
				);
			}
		});
		return id;
	},

	/**
	 * Reemplaza los ítems del cierre y actualiza sus totales — atómico. `compensatingMovements`
	 * son movimientos `ajuste` que reconcilian el ledger de `stock_movements` (append-only, sin
	 * update/delete) contra la diferencia entre las cantidades viejas y nuevas de cada producto.
	 */
	async update(
		id: string,
		patch: {
			expectedIncome: number;
			actualCash: number;
			difference: number;
			reason?: string;
		},
		items: NewCashClosingItemInput[],
		compensatingMovements: Omit<StockMovement, "id">[],
		userId: string,
	): Promise<void> {
		const now = new Date().toISOString();
		await db.transaction(async (tx) => {
			await tx
				.delete(cashClosingItems)
				.where(eq(cashClosingItems.cashClosingId, id));
			if (items.length > 0) {
				await tx.insert(cashClosingItems).values(
					items.map((item) => ({
						...item,
						id: crypto.randomUUID(),
						cashClosingId: id,
					})),
				);
			}
			if (compensatingMovements.length > 0) {
				await stockMovementRepository.createBatch(compensatingMovements, tx);
			}
			await tx
				.update(cashClosings)
				.set({
					expectedIncome: patch.expectedIncome,
					actualCash: patch.actualCash,
					difference: patch.difference,
					reason: patch.reason ?? null,
					updatedAt: now,
					updatedBy: userId,
				})
				.where(eq(cashClosings.id, id));
		});
	},
};
