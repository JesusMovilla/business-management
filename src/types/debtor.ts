/** "deuda" suma al balance (fiado nuevo), "abono" resta (pago parcial o total) — el `amount`
 * siempre es positivo, el `type` da la dirección. Ledger append-only: nunca se edita ni se borra
 * un movimiento (ver `docs/DECISIONS.md`); una corrección se registra como un movimiento nuevo. */
export type DebtorMovementType = "deuda" | "abono";

export interface DebtorMovement {
	id: string;
	debtorId: string;
	type: DebtorMovementType;
	/** Siempre > 0. */
	amount: number;
	/** "YYYY-MM-DD". */
	date: string;
	note?: string;
	/** Cierre de caja que originó este movimiento (una deuda nueva por diferencia faltante, o un
	 * abono aplicado a partir de un sobrante) — `undefined` en abonos/deudas registrados fuera de
	 * un cierre, desde el listado de deudores. */
	cashClosingId?: string;
	createdAt: string;
	createdBy: string;
}

export interface Debtor {
	id: string;
	/** Texto libre — sin relación formal al módulo Contactos (decisión de producto, ver
	 * `docs/DECISIONS.md`). */
	name: string;
	/** Cache de Σ deuda - Σ abono, siempre >= 0 — se mantiene junto con cada movimiento dentro de
	 * la misma transacción, no se recalcula en cada lectura. */
	balance: number;
	createdAt: string;
	createdBy: string;
	updatedAt: string;
	updatedBy?: string;
}

export interface DebtorWithMovements extends Debtor {
	movements: DebtorMovement[];
}

export type NewDebtorMovementInput = Pick<
	DebtorMovement,
	"type" | "amount" | "date" | "note" | "cashClosingId"
>;

/**
 * Una fila del diálogo de asignación de diferencia al finalizar un cierre de caja: apunta a un
 * deudor existente (`debtorId`) o a uno nuevo (`newDebtorName`) — exactamente uno de los dos.
 */
export interface DebtorAllocationInput {
	debtorId?: string;
	newDebtorName?: string;
	amount: number;
	type: DebtorMovementType;
}
