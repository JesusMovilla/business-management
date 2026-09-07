import { doublePrecision, pgTable, text } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { cashClosings } from "./cash-closing";

/**
 * Deudor persistente ("le fío a alguien") — vive independiente de cualquier cierre de caja.
 * `name` es texto libre, sin FK a `contacts` (decisión de producto: mantenerlo simple, ver
 * `docs/DECISIONS.md`), por lo que puede haber más de un deudor con el mismo nombre; se
 * desambiguan mostrando su balance en el buscador. Nunca se borra — un abono deja `balance` en 0
 * sin eliminar el registro, porque es probable que la misma persona vuelva a fiar.
 */
export const debtors = pgTable("debtors", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	// Cache de Σ deuda - Σ abono (ver debtorMovements) — mantenido junto con cada movimiento
	// dentro de la misma transacción, no derivado en cada lectura. Siempre >= 0.
	balance: doublePrecision("balance").notNull().default(0),
	createdAt: text("created_at").notNull(),
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id),
	updatedAt: text("updated_at").notNull(),
	updatedBy: text("updated_by").references(() => user.id),
});

/**
 * Ledger append-only de movimientos de un deudor (mismo criterio que `stock_movements`: nunca se
 * edita ni se borra un registro; una corrección se agrega como un movimiento nuevo con nota). El
 * `amount` siempre es positivo — el `type` da la dirección: "deuda" suma al balance (un faltante
 * de cierre asignado a esta persona, o fiado registrado directo desde el listado), "abono" resta
 * (un pago parcial/total, o un sobrante de cierre aplicado a una deuda existente).
 */
export const debtorMovements = pgTable("debtor_movements", {
	id: text("id").primaryKey(),
	debtorId: text("debtor_id")
		.notNull()
		.references(() => debtors.id, { onDelete: "cascade" }),
	type: text("type").notNull(),
	amount: doublePrecision("amount").notNull(),
	date: text("date").notNull(),
	note: text("note"),
	// Trazabilidad opcional: qué cierre de caja originó este movimiento. `set null` en vez de
	// cascade — el movimiento y el balance del deudor deben sobrevivir aunque el cierre que lo
	// originó se borrara (hoy los cierres no se borran, pero el criterio es el mismo que
	// `cash_closing_items.productId`: no perder historial de deudores por algo ajeno a ellos).
	cashClosingId: text("cash_closing_id").references(() => cashClosings.id, {
		onDelete: "set null",
	}),
	createdAt: text("created_at").notNull(),
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id),
});
