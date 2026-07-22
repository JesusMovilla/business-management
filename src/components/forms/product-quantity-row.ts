import type { ReactNode } from "react";

export interface ProductQuantityRow {
	rowId: string;
	productId: string;
	quantity: string;
	/** Precio de compra unitario en texto — usado por Pedidos, ignorado por los demás llamadores. */
	unitCost?: string;
}

export function emptyProductQuantityRow(): ProductQuantityRow {
	return {
		rowId: `row-${Math.random().toString(36).slice(2, 10)}`,
		productId: "",
		quantity: "",
		unitCost: "",
	};
}

export interface ProductQuantityRowExtraColumn {
	/** Encabezado de la columna, ej. "Precio unitario" o "Subtotal". */
	label: string;
	/** Puede ser un valor de solo lectura o un input editable (ej. `CurrencyInput` para precio de compra). */
	render: (row: ProductQuantityRow) => ReactNode;
	/** Ancho de la columna, ej. "w-40" para un input. Por defecto "w-32". */
	className?: string;
}
