import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { suppliers } from "@/db/schema";
import type { Supplier } from "@/types";

export const supplierRepository = {
	async list(): Promise<Supplier[]> {
		const rows = await db.select().from(suppliers);
		return rows.map((row) => ({
			...row,
			contactName: row.contactName ?? undefined,
			phone: row.phone ?? undefined,
			email: row.email ?? undefined,
			address: row.address ?? undefined,
			notes: row.notes ?? undefined,
		}));
	},
	async create(input: Omit<Supplier, "id">): Promise<string> {
		const id = crypto.randomUUID();
		await db.insert(suppliers).values({ ...input, id });
		return id;
	},
	async remove(id: string): Promise<void> {
		await db.delete(suppliers).where(eq(suppliers.id, id));
	},
};
