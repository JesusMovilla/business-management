import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { profitPayouts } from "@/db/schema";
import type { NewProfitPayoutInput, ProfitPayout } from "@/types";

function toProfitPayout(row: typeof profitPayouts.$inferSelect): ProfitPayout {
	return {
		id: row.id,
		date: row.date,
		amount: row.amount,
		groupId: row.groupId,
		note: row.note,
		status: row.status as ProfitPayout["status"],
		voidReason: row.voidReason ?? undefined,
		createdBy: row.createdBy,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		updatedBy: row.updatedBy ?? undefined,
	};
}

export const profitPayoutRepository = {
	async list(): Promise<ProfitPayout[]> {
		const rows = await db.select().from(profitPayouts);
		return rows.map(toProfitPayout);
	},
	async getById(id: string): Promise<ProfitPayout | null> {
		const [row] = await db
			.select()
			.from(profitPayouts)
			.where(eq(profitPayouts.id, id));
		return row ? toProfitPayout(row) : null;
	},
	async create(input: NewProfitPayoutInput, userId: string): Promise<string> {
		const id = crypto.randomUUID();
		const now = new Date().toISOString();
		await db.insert(profitPayouts).values({
			...input,
			id,
			createdBy: userId,
			createdAt: now,
			updatedAt: now,
		});
		return id;
	},
	/** Anula un pago sin borrarlo — el historial se conserva (ver docs/DECISIONS.md). */
	async void(id: string, reason: string, userId: string): Promise<void> {
		await db
			.update(profitPayouts)
			.set({
				status: "anulado",
				voidReason: reason,
				updatedAt: new Date().toISOString(),
				updatedBy: userId,
			})
			.where(eq(profitPayouts.id, id));
	},
};
