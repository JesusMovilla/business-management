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
}

export interface CashClosingWithItems extends CashClosing {
	items: CashClosingItem[];
}

export type NewCashClosingItemInput = Omit<
	CashClosingItem,
	"id" | "cashClosingId"
>;

export type NewCashClosingInput = Omit<CashClosing, "id" | "items">;

export type BalanceStatus = "ok" | "sobrante" | "faltante";
