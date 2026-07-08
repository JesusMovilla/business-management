import { doublePrecision, integer, pgTable, text } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const cashClosings = pgTable("cash_closings", {
	id: text("id").primaryKey(),
	// "YYYY-MM-DD" — sin unique constraint: puede haber más de un cierre por fecha.
	date: text("date").notNull(),
	expectedIncome: doublePrecision("expected_income").notNull(),
	actualCash: doublePrecision("actual_cash").notNull(),
	difference: doublePrecision("difference").notNull(),
	reason: text("reason"),
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
	updatedBy: text("updated_by").references(() => user.id),
});

export const cashClosingItems = pgTable("cash_closing_items", {
	id: text("id").primaryKey(),
	cashClosingId: text("cash_closing_id")
		.notNull()
		.references(() => cashClosings.id, { onDelete: "cascade" }),
	// Sin FK a products, igual que stock_movements: el ítem sobrevive si se borra el producto.
	productId: text("product_id").notNull(),
	quantitySold: integer("quantity_sold").notNull(),
	unitPrice: doublePrecision("unit_price").notNull(),
});
