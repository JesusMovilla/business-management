import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { expenses } from "@/db/schema";
import type { Expense, NewExpenseInput } from "@/types";

function toExpense(row: typeof expenses.$inferSelect): Expense {
	return {
		id: row.id,
		date: row.date,
		amount: row.amount,
		categoryId: row.categoryId,
		description: row.description,
		supplier: row.supplier ?? undefined,
		paymentMethod: row.paymentMethod,
		invoiceRef: row.invoiceRef ?? undefined,
		status: row.status as Expense["status"],
		type: row.type as Expense["type"],
		voidReason: row.voidReason ?? undefined,
		createdBy: row.createdBy,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		updatedBy: row.updatedBy ?? undefined,
	};
}

export const expenseRepository = {
	async list(): Promise<Expense[]> {
		const rows = await db.select().from(expenses);
		return rows.map(toExpense);
	},
	async getById(id: string): Promise<Expense | null> {
		const [row] = await db.select().from(expenses).where(eq(expenses.id, id));
		return row ? toExpense(row) : null;
	},
	async create(input: NewExpenseInput, userId: string): Promise<string> {
		const id = crypto.randomUUID();
		const now = new Date().toISOString();
		await db.insert(expenses).values({
			...input,
			id,
			supplier: input.supplier ?? null,
			invoiceRef: input.invoiceRef ?? null,
			createdBy: userId,
			createdAt: now,
			updatedAt: now,
		});
		return id;
	},
	async update(
		id: string,
		patch: Omit<NewExpenseInput, "status">,
		userId: string,
	): Promise<void> {
		await db
			.update(expenses)
			.set({
				...patch,
				supplier: patch.supplier ?? null,
				invoiceRef: patch.invoiceRef ?? null,
				updatedAt: new Date().toISOString(),
				updatedBy: userId,
			})
			.where(eq(expenses.id, id));
	},
	/** Anula un gasto sin borrarlo — el historial se conserva (ver docs/DECISIONS.md). */
	async void(id: string, reason: string, userId: string): Promise<void> {
		await db
			.update(expenses)
			.set({
				status: "anulado",
				voidReason: reason,
				updatedAt: new Date().toISOString(),
				updatedBy: userId,
			})
			.where(eq(expenses.id, id));
	},
};
