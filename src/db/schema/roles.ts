import { boolean, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { PermissionTree } from "@/types";

export const roles = pgTable("roles", {
	id: text("id").primaryKey(),
	name: text("name").notNull().unique(),
	description: text("description"),
	isSystem: boolean("is_system").notNull().default(false),
	permissions: jsonb("permissions").notNull().$type<PermissionTree>(),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
});
