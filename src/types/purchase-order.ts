export type PurchaseOrderStatus = "borrador" | "recibido" | "cancelado";

/** El sistema vende por unidad, pero la compra puede venir empacada — ver docs/DECISIONS.md. */
export type PurchaseMode = "paquete" | "unidad";

export interface PurchaseOrderLine {
	id: string;
	productId: string;
	purchaseMode: PurchaseMode;
	/** Cantidad de paquetes (modo "paquete") o de unidades sueltas (modo "unidad"). */
	quantity: number;
	/** Multiplicador efectivo: lo que escribió el usuario si es "paquete", siempre 1 si es "unidad". */
	unitsPerPackage: number;
	/** Precio pagado por `quantity` (por paquete o por unidad, según el modo) — no por unidad individual. */
	unitCost: number;
}

export interface PurchaseOrder {
	id: string;
	/** Proveedor en texto libre — no hay tabla de proveedores (ver docs/DECISIONS.md). */
	supplier: string;
	status: PurchaseOrderStatus;
	/** "YYYY-MM-DD" — fecha en que se hace el pedido. */
	orderDate: string;
	/** "YYYY-MM-DD" — fecha en que se confirma la recepción; solo presente si status es "recibido". */
	receivedDate?: string;
	note?: string;
	/** Id del gasto generado al confirmar recepción — solo presente si status es "recibido". */
	expenseId?: string;
	lines: PurchaseOrderLine[];
	createdBy: string;
	createdAt: string;
	updatedAt: string;
}

export type NewPurchaseOrderInput = {
	supplier: string;
	orderDate: string;
	note?: string;
	lines: Array<{
		productId: string;
		purchaseMode: PurchaseMode;
		quantity: number;
		unitsPerPackage: number;
		unitCost: number;
	}>;
};

/** Total pagado por el pedido — no depende de paquete/unidad, siempre `cantidad × precio`. */
export function purchaseOrderTotal(
	order: Pick<PurchaseOrder, "lines">,
): number {
	return order.lines.reduce(
		(sum, line) => sum + line.quantity * line.unitCost,
		0,
	);
}

/** Unidades reales que entran a inventario por esa línea. */
export function purchaseOrderLineUnits(
	line: Pick<PurchaseOrderLine, "quantity" | "unitsPerPackage">,
): number {
	return line.quantity * line.unitsPerPackage;
}

/** Costo por unidad implícito en esa línea — lo que se refleja en `products.cost` al recibir. */
export function purchaseOrderLineUnitCost(
	line: Pick<PurchaseOrderLine, "unitCost" | "unitsPerPackage">,
): number {
	return line.unitCost / line.unitsPerPackage;
}
