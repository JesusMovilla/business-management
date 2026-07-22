import type { PurchaseMode } from "@/types";

export interface PurchaseOrderLineRow {
	rowId: string;
	productId: string;
	purchaseMode: PurchaseMode;
	/** Paquetes (modo "paquete") o unidades sueltas (modo "unidad") — siempre en texto, como en el resto de los formularios de filas. */
	quantity: string;
	/** Solo relevante en modo "paquete"; en modo "unidad" se fuerza a "1" y no se muestra. */
	unitsPerPackage: string;
	unitCost: string;
}

export function emptyPurchaseOrderLineRow(): PurchaseOrderLineRow {
	return {
		rowId: `line-${Math.random().toString(36).slice(2, 10)}`,
		productId: "",
		purchaseMode: "paquete",
		quantity: "",
		unitsPerPackage: "",
		unitCost: "",
	};
}
