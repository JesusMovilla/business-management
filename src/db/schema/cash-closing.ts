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
	// "borrador" | "activo" | "revertido". Un borrador acumula ventas sin tocar inventario; al
	// finalizar pasa a "activo" y recién ahí se escriben los movimientos de stock. Un cierre
	// revertido no se borra (preserva el historial/auditoría): se generan movimientos `ajuste`
	// que devuelven el stock vendido y el cierre queda marcado.
	status: text("status").notNull().default("activo"),
	reversedAt: text("reversed_at"),
	reversedBy: text("reversed_by").references(() => user.id),
	reversalReason: text("reversal_reason"),
});

/**
 * Una venta registrada durante el borrador — puede incluir varios productos (ver
 * `cashClosingItems.saleId`). Guarda cómo se pagó (efectivo, transferencia, fiado...) y una
 * observación libre, que la UI muestra como título de la venta en vez de "Venta N" — ver
 * `docs/DECISIONS.md`.
 */
export const cashClosingSales = pgTable("cash_closing_sales", {
	id: text("id").primaryKey(),
	cashClosingId: text("cash_closing_id")
		.notNull()
		.references(() => cashClosings.id, { onDelete: "cascade" }),
	paymentMethod: text("payment_method").notNull(),
	note: text("note"),
	createdAt: text("created_at").notNull(),
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id),
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
	// Nullable: los ítems creados antes de esta columna no tienen snapshot y se backfillean con el
	// costo vigente al momento de la migración (ver docs/DECISIONS.md) — mejor aproximación posible,
	// no un valor histórico real.
	unitCost: doublePrecision("unit_cost"),
	// Nullable: ítems creados antes del flujo de borrador no tienen momento/autor individual de
	// venta — solo se completan para ítems registrados uno por uno durante un borrador.
	createdAt: text("created_at"),
	createdBy: text("created_by").references(() => user.id),
	// Agrupa los ítems registrados juntos en una misma venta (una venta puede incluir varios
	// productos). Nullable: ítems creados antes de esta columna no tienen grupo (se muestran como
	// una venta de un solo ítem, ver `docs/DECISIONS.md`).
	saleId: text("sale_id").references(() => cashClosingSales.id, {
		onDelete: "cascade",
	}),
});
