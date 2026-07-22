import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { expenses, purchaseOrderLines, purchaseOrders } from "@/db/schema";
import type {
	NewPurchaseOrderInput,
	PurchaseMode,
	PurchaseOrder,
	PurchaseOrderLine,
	PurchaseOrderStatus,
} from "@/types";
import {
	purchaseOrderLineUnitCost,
	purchaseOrderLineUnits,
	purchaseOrderTotal,
} from "@/types";
import { productRepository } from "./product-repository";
import { stockMovementRepository } from "./stock-movement-repository";

const COMPRA_MERCANCIA_CATEGORY_ID = "exp-cat-compra-mercancia";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function toLine(
	row: typeof purchaseOrderLines.$inferSelect,
): PurchaseOrderLine {
	return {
		id: row.id,
		productId: row.productId,
		purchaseMode: row.purchaseMode as PurchaseMode,
		quantity: row.quantity,
		unitsPerPackage: row.unitsPerPackage,
		unitCost: row.unitCost,
	};
}

function toOrder(
	row: typeof purchaseOrders.$inferSelect,
	lines: PurchaseOrderLine[],
): PurchaseOrder {
	return {
		id: row.id,
		supplier: row.supplier,
		status: row.status as PurchaseOrderStatus,
		orderDate: row.orderDate,
		receivedDate: row.receivedDate ?? undefined,
		note: row.note ?? undefined,
		expenseId: row.expenseId ?? undefined,
		lines,
		createdBy: row.createdBy,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
}

function nowIso() {
	return new Date().toISOString();
}

async function insertLines(
	tx: Tx,
	purchaseOrderId: string,
	lines: NewPurchaseOrderInput["lines"],
) {
	await tx.insert(purchaseOrderLines).values(
		lines.map((line) => ({
			id: crypto.randomUUID(),
			purchaseOrderId,
			productId: line.productId,
			purchaseMode: line.purchaseMode,
			quantity: line.quantity,
			unitsPerPackage: line.unitsPerPackage,
			unitCost: line.unitCost,
		})),
	);
}

export const purchaseOrderRepository = {
	async list(): Promise<PurchaseOrder[]> {
		const [orderRows, lineRows] = await Promise.all([
			db.select().from(purchaseOrders),
			db.select().from(purchaseOrderLines),
		]);
		const linesByOrder = new Map<string, PurchaseOrderLine[]>();
		for (const row of lineRows) {
			const line = toLine(row);
			const existing = linesByOrder.get(row.purchaseOrderId);
			if (existing) existing.push(line);
			else linesByOrder.set(row.purchaseOrderId, [line]);
		}
		return orderRows.map((row) => toOrder(row, linesByOrder.get(row.id) ?? []));
	},

	async getById(id: string): Promise<PurchaseOrder | null> {
		const [row] = await db
			.select()
			.from(purchaseOrders)
			.where(eq(purchaseOrders.id, id));
		if (!row) return null;
		const lineRows = await db
			.select()
			.from(purchaseOrderLines)
			.where(eq(purchaseOrderLines.purchaseOrderId, id));
		return toOrder(row, lineRows.map(toLine));
	},

	/** Crea el pedido en estado "borrador" — no toca inventario ni gastos. */
	async create(input: NewPurchaseOrderInput, userId: string): Promise<string> {
		const id = crypto.randomUUID();
		const now = nowIso();
		await db.transaction(async (tx) => {
			await tx.insert(purchaseOrders).values({
				id,
				supplier: input.supplier,
				status: "borrador",
				orderDate: input.orderDate,
				note: input.note ?? null,
				createdBy: userId,
				createdAt: now,
				updatedAt: now,
			});
			await insertLines(tx, id, input.lines);
		});
		return id;
	},

	/** Reemplaza los datos y líneas de un pedido en borrador. Lanza si ya no está en borrador. */
	async update(id: string, input: NewPurchaseOrderInput): Promise<void> {
		await db.transaction(async (tx) => {
			const [row] = await tx
				.select()
				.from(purchaseOrders)
				.where(eq(purchaseOrders.id, id));
			if (!row) throw new Error("El pedido no existe.");
			if (row.status !== "borrador") {
				throw new Error("Solo se puede editar un pedido en borrador.");
			}
			await tx
				.update(purchaseOrders)
				.set({
					supplier: input.supplier,
					orderDate: input.orderDate,
					note: input.note ?? null,
					updatedAt: nowIso(),
				})
				.where(eq(purchaseOrders.id, id));
			await tx
				.delete(purchaseOrderLines)
				.where(eq(purchaseOrderLines.purchaseOrderId, id));
			await insertLines(tx, id, input.lines);
		});
	},

	/** Cancela un pedido en borrador — no afecta inventario ni gastos. */
	async cancel(id: string): Promise<void> {
		await db.transaction(async (tx) => {
			const [row] = await tx
				.select()
				.from(purchaseOrders)
				.where(eq(purchaseOrders.id, id));
			if (!row) throw new Error("El pedido no existe.");
			if (row.status !== "borrador") {
				throw new Error("Solo se puede cancelar un pedido en borrador.");
			}
			await tx
				.update(purchaseOrders)
				.set({ status: "cancelado", updatedAt: nowIso() })
				.where(eq(purchaseOrders.id, id));
		});
	},

	/**
	 * Confirma la recepción de un pedido en borrador: registra una entrada de inventario por cada
	 * línea (convertida a unidades reales si la línea se compró por paquete), actualiza el costo
	 * unitario del producto con el precio de esta compra, y genera un gasto por el total — todo en
	 * una sola transacción (si algo falla, no queda inventario, costo o gasto a medias). Ver
	 * docs/MODULES.md.
	 */
	async receive(
		id: string,
		receivedDate: string,
		paymentMethod: string,
		userId: string,
	): Promise<void> {
		await db.transaction(async (tx) => {
			const [row] = await tx
				.select()
				.from(purchaseOrders)
				.where(eq(purchaseOrders.id, id));
			if (!row) throw new Error("El pedido no existe.");
			if (row.status !== "borrador") {
				throw new Error("Solo se puede recibir un pedido en borrador.");
			}
			const lineRows = await tx
				.select()
				.from(purchaseOrderLines)
				.where(eq(purchaseOrderLines.purchaseOrderId, id));
			const lines = lineRows.map(toLine);
			if (lines.length === 0) {
				throw new Error("El pedido no tiene líneas de producto.");
			}

			await stockMovementRepository.createBatch(
				lines.map((line) => ({
					productId: line.productId,
					type: "entrada",
					delta: purchaseOrderLineUnits(line),
					date: receivedDate,
					note: `Pedido a ${row.supplier} recibido`,
					userId,
				})),
				tx,
			);

			for (const line of lines) {
				await productRepository.update(
					line.productId,
					{ pricing: { cost: purchaseOrderLineUnitCost(line) } },
					tx,
				);
			}

			const expenseId = crypto.randomUUID();
			const now = nowIso();
			const total = purchaseOrderTotal({ lines });
			await tx.insert(expenses).values({
				id: expenseId,
				date: receivedDate,
				amount: total,
				categoryId: COMPRA_MERCANCIA_CATEGORY_ID,
				description: `Pedido a ${row.supplier}`,
				supplier: row.supplier,
				paymentMethod,
				status: "pagado",
				type: "variable",
				createdBy: userId,
				createdAt: now,
				updatedAt: now,
			});

			await tx
				.update(purchaseOrders)
				.set({
					status: "recibido",
					receivedDate,
					expenseId,
					updatedAt: now,
				})
				.where(eq(purchaseOrders.id, id));
		});
	},

	/** Solo se puede borrar un pedido en borrador — uno recibido queda como historial (igual que Gastos). */
	async remove(id: string): Promise<void> {
		await db.transaction(async (tx) => {
			const [row] = await tx
				.select()
				.from(purchaseOrders)
				.where(eq(purchaseOrders.id, id));
			if (!row) return;
			if (row.status !== "borrador") {
				throw new Error("Solo se puede eliminar un pedido en borrador.");
			}
			await tx
				.delete(purchaseOrderLines)
				.where(eq(purchaseOrderLines.purchaseOrderId, id));
			await tx.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
		});
	},
};
