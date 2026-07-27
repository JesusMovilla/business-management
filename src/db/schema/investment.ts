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

/**
 * Pagos de ganancias a los grupos de socios — vivió en el esquema del módulo Proyección de
 * ganancias (ya eliminado, ver docs/DECISIONS.md) porque ahí se calculaba cuánto había disponible
 * para repartir; al quitar ese módulo se mudó acá, junto al resto de Control de inversión, sin
 * cambiar el nombre de tabla (`profit_payouts`, no requiere migración).
 */
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
