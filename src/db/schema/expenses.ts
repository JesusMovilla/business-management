import { doublePrecision, pgTable, text } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const expenseCategories = pgTable("expense_categories", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	// Sin FK a sí misma: subcategoría es solo una referencia de texto al id del padre, igual de
	// simple que otros campos "libres" del proyecto (evita el self-reference tipado en Drizzle).
	parentId: text("parent_id"),
});

export const expenses = pgTable("expenses", {
	id: text("id").primaryKey(),
	date: text("date").notNull(),
	amount: doublePrecision("amount").notNull(),
	categoryId: text("category_id")
		.notNull()
		.references(() => expenseCategories.id),
	description: text("description").notNull(),
	supplier: text("supplier"),
	paymentMethod: text("payment_method").notNull(),
	invoiceRef: text("invoice_ref"),
	status: text("status").notNull(),
	type: text("type").notNull(),
	voidReason: text("void_reason"),
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
	updatedBy: text("updated_by").references(() => user.id),
});
