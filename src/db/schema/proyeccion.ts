import { doublePrecision, pgTable, text } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { investmentGroups } from "./investment";

export const profitPayouts = pgTable("profit_payouts", {
	id: text("id").primaryKey(),
	date: text("date").notNull(),
	amount: doublePrecision("amount").notNull(),
	groupId: text("group_id")
		.notNull()
		.references(() => investmentGroups.id),
	note: text("note").notNull(),
	status: text("status").notNull(),
	voidReason: text("void_reason"),
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
	updatedBy: text("updated_by").references(() => user.id),
});
