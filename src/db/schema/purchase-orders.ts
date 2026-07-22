import { doublePrecision, integer, pgTable, text } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { expenses } from "./expenses";
import { products } from "./inventory";

export const purchaseOrders = pgTable("purchase_orders", {
	id: text("id").primaryKey(),
	supplier: text("supplier").notNull(),
	status: text("status").notNull(),
	orderDate: text("order_date").notNull(),
	receivedDate: text("received_date"),
	note: text("note"),
	// Se llena al confirmar recepción — el gasto que ese pedido generó.
	expenseId: text("expense_id").references(() => expenses.id),
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
});

export const purchaseOrderLines = pgTable("purchase_order_lines", {
	id: text("id").primaryKey(),
	purchaseOrderId: text("purchase_order_id")
		.notNull()
		.references(() => purchaseOrders.id, { onDelete: "cascade" }),
	productId: text("product_id")
		.notNull()
		.references(() => products.id),
	// "paquete" | "unidad" — ver PurchaseMode en src/types/purchase-order.ts.
	purchaseMode: text("purchase_mode").notNull(),
	quantity: integer("quantity").notNull(),
	unitsPerPackage: integer("units_per_package").notNull(),
	unitCost: doublePrecision("unit_cost").notNull(),
});
