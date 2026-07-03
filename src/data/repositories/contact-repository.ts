import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { contacts } from "@/db/schema";
import type { Contact } from "@/types";

export const contactRepository = {
	async list(): Promise<Contact[]> {
		return db.select().from(contacts);
	},
	async create(input: Omit<Contact, "id">): Promise<string> {
		const id = crypto.randomUUID();
		await db.insert(contacts).values({ ...input, id });
		return id;
	},
	async update(id: string, patch: Partial<Omit<Contact, "id">>): Promise<void> {
		await db.update(contacts).set(patch).where(eq(contacts.id, id));
	},
	async remove(id: string): Promise<void> {
		await db.delete(contacts).where(eq(contacts.id, id));
	},
};
