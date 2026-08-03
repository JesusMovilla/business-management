export interface CashClosingItem {
	id: string;
	cashClosingId: string;
	productId: string;
	quantitySold: number;
	/** Snapshot del `retailPrice` del producto al momento del cierre. */
	unitPrice: number;
	/** Snapshot del `cost` del producto al momento del cierre — `null` en ítems creados antes de
	 * este campo (ver `docs/DECISIONS.md`); la ganancia real de esos ítems usa el costo vigente
	 * como aproximación. */
	unitCost: number | null;
	/** Momento y autor del registro individual de esta venta — `undefined` en ítems creados antes
	 * del flujo de borrador (ver `docs/DECISIONS.md`). */
	createdAt?: string;
	createdBy?: string;
	/** Agrupa los ítems registrados juntos en una misma venta (una venta puede incluir varios
	 * productos) — `undefined` en ítems creados antes de esta columna, se muestran como una venta
	 * de un solo ítem. */
	saleId?: string;
}

export interface CashClosing {
	id: string;
	/** "YYYY-MM-DD" — fecha del cierre, sin restricción de unicidad. */
	date: string;
	/** Snapshot: Σ cantidad × precio unitario de los ítems al momento del cierre. */
	expectedIncome: number;
	actualCash: number;
	/** `actualCash - expectedIncome`. */
	difference: number;
	/** Obligatorio cuando `difference !== 0`, validado en el servidor. */
	reason?: string;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
	updatedBy?: string;
	status: CashClosingStatus;
	reversedAt?: string;
	reversedBy?: string;
	/** Obligatorio al revertir, validado en el servidor. */
	reversalReason?: string;
}

export type CashClosingStatus = "borrador" | "activo" | "revertido";

/**
 * Una venta registrada durante un borrador — puede incluir varios productos (ver
 * `CashClosingItem.saleId`). Guarda cómo se pagó y una observación libre que la UI usa como título
 * de la venta en vez de "Venta N" cuando está presente.
 */
export interface CashClosingSale {
	id: string;
	cashClosingId: string;
	/** Texto libre, ej. "Efectivo", "Transferencia", "Fiado" — mismo criterio que `paymentMethod` en Gastos. */
	paymentMethod: string;
	note?: string;
	createdAt: string;
	createdBy: string;
}

export type NewCashClosingSaleInput = Pick<
	CashClosingSale,
	"paymentMethod" | "note"
>;

export interface CashClosingWithItems extends CashClosing {
	items: CashClosingItem[];
	sales: CashClosingSale[];
}

export type NewCashClosingItemInput = Omit<
	CashClosingItem,
	"id" | "cashClosingId" | "createdAt" | "createdBy" | "saleId"
>;

export type NewCashClosingInput = Omit<
	CashClosing,
	"id" | "status" | "reversedAt" | "reversedBy" | "reversalReason"
>;

export type BalanceStatus = "ok" | "sobrante" | "faltante";
