import type { ReactNode } from "react";

export interface ProductQuantityRow {
	rowId: string;
	productId: string;
	quantity: string;
}

export function emptyProductQuantityRow(): ProductQuantityRow {
	return {
		rowId: `row-${Math.random().toString(36).slice(2, 10)}`,
		productId: "",
		quantity: "",
	};
}

export interface ProductQuantityRowExtraColumn {
	/** Encabezado de la columna, ej. "Precio unitario" o "Subtotal". */
	label: string;
	render: (row: ProductQuantityRow) => ReactNode;
}
