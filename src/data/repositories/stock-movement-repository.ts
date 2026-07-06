import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { stockMovements } from "@/db/schema";
import type { MermaReason, StockMovement, StockMovementType } from "@/types";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function toStockMovement(
	row: typeof stockMovements.$inferSelect,
): StockMovement {
	return {
		id: row.id,
		productId: row.productId,
		type: row.type as StockMovementType,
		delta: row.delta,
		date: row.date,
		reason: (row.reason ?? undefined) as MermaReason | undefined,
		note: row.note ?? undefined,
		userId: row.userId,
	};
}

export const stockMovementRepository = {
	async listAll(): Promise<StockMovement[]> {
		const rows = await db.select().from(stockMovements);
		return rows.map(toStockMovement);
	},
	async listByProduct(productId: string): Promise<StockMovement[]> {
		const rows = await db
			.select()
			.from(stockMovements)
			.where(eq(stockMovements.productId, productId));
		return rows.map(toStockMovement);
	},
	async create(
		input: Omit<StockMovement, "id">,
		tx: Tx | typeof db = db,
	): Promise<string> {
		const id = crypto.randomUUID();
		await tx.insert(stockMovements).values({ ...input, id });
		return id;
	},
	async createBatch(inputs: Omit<StockMovement, "id">[]): Promise<void> {
		await db.transaction(async (tx) => {
			for (const input of inputs) {
				await stockMovementRepository.create(input, tx);
			}
		});
	},
};
