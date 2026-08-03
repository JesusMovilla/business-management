import { and, desc, eq, sql } from "drizzle-orm";
import { stockMovementRepository } from "@/data/repositories/stock-movement-repository";
import { db } from "@/db/client";
import { cashClosingItems, cashClosingSales, cashClosings } from "@/db/schema";
import type {
	CashClosing,
	CashClosingItem,
	CashClosingSale,
	CashClosingStatus,
	CashClosingWithItems,
	NewCashClosingItemInput,
	NewCashClosingSaleInput,
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
		status: row.status as CashClosingStatus,
		reversedAt: row.reversedAt ?? undefined,
		reversedBy: row.reversedBy ?? undefined,
		reversalReason: row.reversalReason ?? undefined,
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
		unitCost: row.unitCost,
		createdAt: row.createdAt ?? undefined,
		createdBy: row.createdBy ?? undefined,
		saleId: row.saleId ?? undefined,
	};
}

function toCashClosingSale(
	row: typeof cashClosingSales.$inferSelect,
): CashClosingSale {
	return {
		id: row.id,
		cashClosingId: row.cashClosingId,
		paymentMethod: row.paymentMethod,
		note: row.note ?? undefined,
		createdAt: row.createdAt,
		createdBy: row.createdBy,
	};
}

async function loadWithItemsAndSales(
	closing: typeof cashClosings.$inferSelect,
): Promise<CashClosingWithItems> {
	const [items, sales] = await Promise.all([
		db
			.select()
			.from(cashClosingItems)
			.where(eq(cashClosingItems.cashClosingId, closing.id)),
		db
			.select()
			.from(cashClosingSales)
			.where(eq(cashClosingSales.cashClosingId, closing.id)),
	]);
	return {
		...toCashClosing(closing),
		items: items.map(toCashClosingItem),
		sales: sales.map(toCashClosingSale),
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
		return loadWithItemsAndSales(closing);
	},

	/** El borrador abierto (a lo sumo uno) — la caja en curso donde el vendedor va registrando
	 * ventas una por una durante el día. */
	async getOpenDraft(): Promise<CashClosingWithItems | null> {
		const [closing] = await db
			.select()
			.from(cashClosings)
			.where(eq(cashClosings.status, "borrador"));
		if (!closing) return null;
		return loadWithItemsAndSales(closing);
	},

	/** Abre un borrador nuevo — no toca inventario ni calcula totales todavía. */
	async createDraft(userId: string, date: string): Promise<string> {
		const id = crypto.randomUUID();
		const now = new Date().toISOString();
		await db.insert(cashClosings).values({
			id,
			date,
			expectedIncome: 0,
			actualCash: 0,
			difference: 0,
			createdBy: userId,
			createdAt: now,
			updatedAt: now,
			status: "borrador",
		});
		return id;
	},

	/**
	 * Registra una venta (uno o más productos) en el borrador — inserta la venta
	 * (`cash_closing_sales`, con su método de pago y observación) y sus ítems (compartiendo el id
	 * de la venta como `saleId`), y suma el monto total al `expectedIncome` acumulado, todo en una
	 * transacción. No escribe `stock_movements`: el descuento real de inventario ocurre recién al
	 * finalizar (ver `finalize`).
	 */
	async addDraftSale(
		draftId: string,
		sale: NewCashClosingSaleInput,
		items: NewCashClosingItemInput[],
		userId: string,
	): Promise<string> {
		const saleId = crypto.randomUUID();
		const now = new Date().toISOString();
		const total = items.reduce(
			(sum, item) => sum + item.quantitySold * item.unitPrice,
			0,
		);
		await db.transaction(async (tx) => {
			await tx.insert(cashClosingSales).values({
				id: saleId,
				cashClosingId: draftId,
				paymentMethod: sale.paymentMethod,
				note: sale.note ?? null,
				createdAt: now,
				createdBy: userId,
			});
			await tx.insert(cashClosingItems).values(
				items.map((item) => ({
					...item,
					id: crypto.randomUUID(),
					cashClosingId: draftId,
					createdAt: now,
					createdBy: userId,
					saleId,
				})),
			);
			await tx
				.update(cashClosings)
				.set({
					expectedIncome: sql`${cashClosings.expectedIncome} + ${total}`,
					updatedAt: now,
				})
				.where(eq(cashClosings.id, draftId));
		});
		return saleId;
	},

	/** Cambia la cantidad de un ítem ya registrado en el borrador, ajustando el `expectedIncome`
	 * acumulado por la diferencia. */
	async updateDraftItemQuantity(
		draftId: string,
		itemId: string,
		quantitySold: number,
	): Promise<void> {
		const now = new Date().toISOString();
		await db.transaction(async (tx) => {
			const [item] = await tx
				.select()
				.from(cashClosingItems)
				.where(eq(cashClosingItems.id, itemId));
			if (!item || item.cashClosingId !== draftId) return;
			const delta = (quantitySold - item.quantitySold) * item.unitPrice;
			await tx
				.update(cashClosingItems)
				.set({ quantitySold })
				.where(eq(cashClosingItems.id, itemId));
			await tx
				.update(cashClosings)
				.set({
					expectedIncome: sql`${cashClosings.expectedIncome} + ${delta}`,
					updatedAt: now,
				})
				.where(eq(cashClosings.id, draftId));
		});
	},

	/**
	 * Deshace una venta registrada por error en el borrador antes de finalizar. Si era el último
	 * ítem de su venta, también borra la venta (`cash_closing_sales`) para no dejar un grupo vacío.
	 */
	async removeDraftItem(draftId: string, itemId: string): Promise<void> {
		const now = new Date().toISOString();
		await db.transaction(async (tx) => {
			const [item] = await tx
				.select()
				.from(cashClosingItems)
				.where(eq(cashClosingItems.id, itemId));
			if (!item || item.cashClosingId !== draftId) return;
			await tx.delete(cashClosingItems).where(eq(cashClosingItems.id, itemId));
			await tx
				.update(cashClosings)
				.set({
					expectedIncome: sql`${cashClosings.expectedIncome} - ${item.quantitySold * item.unitPrice}`,
					updatedAt: now,
				})
				.where(eq(cashClosings.id, draftId));

			if (item.saleId) {
				const remaining = await tx
					.select({ id: cashClosingItems.id })
					.from(cashClosingItems)
					.where(eq(cashClosingItems.saleId, item.saleId));
				if (remaining.length === 0) {
					await tx
						.delete(cashClosingSales)
						.where(eq(cashClosingSales.id, item.saleId));
				}
			}
		});
	},

	/** Cambia la fecha del cierre en curso — editable mientras siga en borrador. */
	async updateDraftDate(draftId: string, date: string): Promise<void> {
		await db
			.update(cashClosings)
			.set({ date, updatedAt: new Date().toISOString() })
			.where(eq(cashClosings.id, draftId));
	},

	/**
	 * Finaliza el borrador: agrupa los ítems por producto y escribe el batch de `stock_movements`
	 * tipo `venta` (mismo mecanismo que el cierre de un solo paso de antes), y marca el cierre
	 * como `activo` con el dinero contado y la diferencia — todo atómico. Las ventas registradas
	 * (`cash_closing_sales`) no se tocan: quedan asociadas al mismo cierre para mostrarse en el
	 * detalle ya finalizado.
	 */
	async finalize(
		draftId: string,
		patch: {
			expectedIncome: number;
			actualCash: number;
			difference: number;
			reason?: string;
		},
		userId: string,
	): Promise<void> {
		const now = new Date().toISOString();
		await db.transaction(async (tx) => {
			const items = await tx
				.select()
				.from(cashClosingItems)
				.where(eq(cashClosingItems.cashClosingId, draftId));
			const quantityByProduct = new Map<string, number>();
			for (const item of items) {
				quantityByProduct.set(
					item.productId,
					(quantityByProduct.get(item.productId) ?? 0) + item.quantitySold,
				);
			}
			if (quantityByProduct.size > 0) {
				await stockMovementRepository.createBatch(
					[...quantityByProduct.entries()].map(([productId, quantitySold]) => ({
						productId,
						type: "venta" as const,
						delta: -quantitySold,
						date: now,
						userId,
					})),
					tx,
				);
			}
			await tx
				.update(cashClosings)
				.set({
					expectedIncome: patch.expectedIncome,
					actualCash: patch.actualCash,
					difference: patch.difference,
					reason: patch.reason ?? null,
					status: "activo",
					updatedAt: now,
					updatedBy: userId,
				})
				.where(eq(cashClosings.id, draftId));
		});
	},

	/** Abandona un borrador sin finalizar — borra el cierre, sus ítems y sus ventas, sin afectar
	 * inventario. */
	async cancelDraft(draftId: string): Promise<void> {
		await db.transaction(async (tx) => {
			await tx
				.delete(cashClosingItems)
				.where(eq(cashClosingItems.cashClosingId, draftId));
			await tx
				.delete(cashClosingSales)
				.where(eq(cashClosingSales.cashClosingId, draftId));
			await tx
				.delete(cashClosings)
				.where(
					and(
						eq(cashClosings.id, draftId),
						eq(cashClosings.status, "borrador"),
					),
				);
		});
	},

	/**
	 * Reemplaza los ítems del cierre y actualiza sus totales — atómico. `compensatingMovements`
	 * son movimientos `ajuste` que reconcilian el ledger de `stock_movements` (append-only, sin
	 * update/delete) contra la diferencia entre las cantidades viejas y nuevas de cada producto.
	 * También borra las ventas (`cash_closing_sales`) del cierre: los ítems se reemplazan por una
	 * lista plana reconstruida desde el formulario de edición, que no tiene el detalle de
	 * venta/método de pago original — mantenerlas huérfanas no aportaría nada.
	 */
	async update(
		id: string,
		patch: {
			date: string;
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
			await tx
				.delete(cashClosingSales)
				.where(eq(cashClosingSales.cashClosingId, id));
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
					date: patch.date,
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

	/**
	 * Revierte un cierre ya guardado — atómico. No borra el cierre ni sus ítems (auditoría), solo
	 * lo marca `revertido` e inserta movimientos `ajuste` que devuelven al inventario la cantidad
	 * vendida de cada ítem (ledger append-only, igual que `update`), con `reason` como descripción
	 * del movimiento para que quede visible en el historial de Inventario. Ver `docs/DECISIONS.md`.
	 */
	async revert(
		id: string,
		closingDate: string,
		items: CashClosingItem[],
		reason: string,
		userId: string,
	): Promise<void> {
		const now = new Date().toISOString();
		await db.transaction(async (tx) => {
			if (items.length > 0) {
				await stockMovementRepository.createBatch(
					items.map((item) => ({
						productId: item.productId,
						type: "ajuste" as const,
						delta: item.quantitySold,
						date: now,
						note: `Reversión de cierre de caja del ${closingDate}: ${reason}`,
						userId,
					})),
					tx,
				);
			}
			await tx
				.update(cashClosings)
				.set({
					status: "revertido",
					reversedAt: now,
					reversedBy: userId,
					reversalReason: reason,
					updatedAt: now,
					updatedBy: userId,
				})
				.where(eq(cashClosings.id, id));
		});
	},
};
