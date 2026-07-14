import {
	doublePrecision,
	pgTable,
	primaryKey,
	text,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const investmentGroups = pgTable("investment_groups", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	status: text("status").notNull(),
});

export const investmentGroupMembers = pgTable(
	"investment_group_members",
	{
		groupId: text("group_id")
			.notNull()
			.references(() => investmentGroups.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id),
	},
	(table) => [primaryKey({ columns: [table.groupId, table.userId] })],
);

export const investments = pgTable("investments", {
	id: text("id").primaryKey(),
	date: text("date").notNull(),
	amount: doublePrecision("amount").notNull(),
	groupId: text("group_id")
		.notNull()
		.references(() => investmentGroups.id),
	description: text("description").notNull(),
	status: text("status").notNull(),
	voidReason: text("void_reason"),
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
	updatedBy: text("updated_by").references(() => user.id),
});
