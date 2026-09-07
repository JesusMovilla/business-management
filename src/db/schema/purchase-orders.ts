import { doublePrecision, integer, pgTable, text } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { expenses } from "./expenses";
import { products } from "./inventory";

export const purchaseOrders = pgTable("purchase_orders", {
	id: text("id").primaryKey(),
	supplier: text("supplier").notNull(),
	// "borrador" | "recibido" | "cancelado" | "revertido"
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
	// Un pedido revertido no se borra (preserva el historial/auditoría): se generan movimientos
	// `ajuste` que deshacen la entrada de inventario, se anula el gasto asociado, y el pedido
	// queda marcado. Mismo patrón que `cash_closings`.
	reversedAt: text("reversed_at"),
	reversedBy: text("reversed_by").references(() => user.id),
	reversalReason: text("reversal_reason"),
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
	// Costo del producto justo antes de recibir esta línea — snapshot para poder restaurarlo si
	// se revierte la recepción. Nullable: líneas de pedidos recibidos antes de esta columna no
	// tienen snapshot y su costo no se restaura al revertir.
	previousUnitCost: doublePrecision("previous_unit_cost"),
});
