import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { expenseCategories } from "@/db/schema";
import type { ExpenseCategory } from "@/types";

function toCategory(
	row: typeof expenseCategories.$inferSelect,
): ExpenseCategory {
	return { id: row.id, name: row.name, parentId: row.parentId ?? undefined };
}

export const expenseCategoryRepository = {
	async list(): Promise<ExpenseCategory[]> {
		const rows = await db.select().from(expenseCategories);
		return rows.map(toCategory);
	},
	async create(input: Omit<ExpenseCategory, "id">): Promise<string> {
		const id = crypto.randomUUID();
		await db
			.insert(expenseCategories)
			.values({ ...input, id, parentId: input.parentId ?? null });
		return id;
	},
	async remove(id: string): Promise<void> {
		await db.delete(expenseCategories).where(eq(expenseCategories.id, id));
	},
};
