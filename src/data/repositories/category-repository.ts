import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { categories } from "@/db/schema";
import type { Category } from "@/types";

export const categoryRepository = {
	async list(): Promise<Category[]> {
		const rows = await db.select().from(categories);
		return rows.map((row) => ({
			...row,
			description: row.description ?? undefined,
		}));
	},
	async create(input: Omit<Category, "id">): Promise<string> {
		const id = crypto.randomUUID();
		await db.insert(categories).values({ ...input, id });
		return id;
	},
	async remove(id: string): Promise<void> {
		await db.delete(categories).where(eq(categories.id, id));
	},
};
