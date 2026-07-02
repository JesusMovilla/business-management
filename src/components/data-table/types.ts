import type { RowData } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
	interface ColumnMeta<TData extends RowData, TValue> {
		/** Etiqueta legible de la columna, usada por `DataTableViewOptions`. */
		title?: string;
	}
}
