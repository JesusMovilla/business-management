import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { investments } from "@/db/schema";
import type { Investment, NewInvestmentInput } from "@/types";

function toInvestment(row: typeof investments.$inferSelect): Investment {
	return {
		id: row.id,
		date: row.date,
		amount: row.amount,
		groupId: row.groupId,
		description: row.description,
		status: row.status as Investment["status"],
		voidReason: row.voidReason ?? undefined,
		createdBy: row.createdBy,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		updatedBy: row.updatedBy ?? undefined,
	};
}

export const investmentRepository = {
	async list(): Promise<Investment[]> {
		const rows = await db.select().from(investments);
		return rows.map(toInvestment);
	},
	async getById(id: string): Promise<Investment | null> {
		const [row] = await db
			.select()
			.from(investments)
			.where(eq(investments.id, id));
		return row ? toInvestment(row) : null;
	},
	async create(input: NewInvestmentInput, userId: string): Promise<string> {
		const id = crypto.randomUUID();
		const now = new Date().toISOString();
		await db.insert(investments).values({
			...input,
			id,
			createdBy: userId,
			createdAt: now,
			updatedAt: now,
		});
		return id;
	},
	async update(
		id: string,
		patch: Omit<NewInvestmentInput, "status">,
		userId: string,
	): Promise<void> {
		await db
			.update(investments)
			.set({
				...patch,
				updatedAt: new Date().toISOString(),
				updatedBy: userId,
			})
			.where(eq(investments.id, id));
	},
	/** Anula una inversión sin borrarla — el historial se conserva (ver docs/DECISIONS.md). */
	async void(id: string, reason: string, userId: string): Promise<void> {
		await db
			.update(investments)
			.set({
				status: "anulada",
				voidReason: reason,
				updatedAt: new Date().toISOString(),
				updatedBy: userId,
			})
			.where(eq(investments.id, id));
	},
};
