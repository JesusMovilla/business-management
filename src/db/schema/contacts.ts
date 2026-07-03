import { pgTable, text } from "drizzle-orm/pg-core";

export const contacts = pgTable("contacts", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	phone: text("phone").notNull(),
	description: text("description").notNull(),
});
