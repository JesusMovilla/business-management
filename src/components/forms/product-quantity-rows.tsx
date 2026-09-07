"use client";

import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type {
	ProductQuantityRow,
	ProductQuantityRowExtraColumn,
} from "./product-quantity-row";

interface ProductQuantityRowsProps {
	rows: ProductQuantityRow[];
	products: { id: string; name: string; presentation: string }[];
	/** Label del campo de cantidad, ej. "Cantidad" (entradas) o "Cantidad vendida" (cierre de caja). */
	quantityLabel?: string;
	onUpdateRow: (rowId: string, patch: Partial<ProductQuantityRow>) => void;
	onRemoveRow: (rowId: string) => void;
	/** Columna de solo lectura/control antes del selector de producto (ej. la fecha del cierre en
	 * Cierre de caja) — recibe el índice de la fila para que el caller decida si solo la muestra
	 * en la primera (`index === 0`) y deja las demás en blanco, preservando la alineación. Cada
	 * fila ocupa el ancho completo en mobile (stack vertical); `className` solo fija un ancho fijo
	 * a partir de `sm:` (ej. "sm:w-40"), nunca sin prefijo, para no romper el layout en mobile. */
	leadingColumn?: {
		label: string;
		render: (row: ProductQuantityRow, index: number) => ReactNode;
		className?: string;
	};
	/** Columnas adicionales de solo lectura por fila (ej. precio unitario y subtotal en cierre de caja), cada una en su propia columna. */
	extraColumns?: ProductQuantityRowExtraColumn[];
	/** Mensaje de error de esa fila (ej. cantidad mayor al stock disponible). El input de cantidad se marca como inválido y el mensaje ocupa el ancho completo de la fila. */
	getRowError?: (row: ProductQuantityRow) => string | undefined;
}

/**
 * Filas dinámicas de producto + cantidad, reutilizadas por formularios que registran varias
 * líneas de producto en un solo envío (entrada masiva de Inventario, cierre de caja). El estado
 * de las filas vive en el componente padre (`useState<ProductQuantityRow[]>` +
 * `emptyProductQuantityRow()`); este componente es puramente presentacional. Un mismo producto
 * solo puede seleccionarse en una fila a la vez (las demás filas lo excluyen del selector).
 *
 * Ejemplo:
 * ```tsx
 * const [rows, setRows] = useState([emptyProductQuantityRow()]);
 * <ProductQuantityRows
 *   rows={rows}
 *   products={products}
 *   onUpdateRow={(rowId, patch) =>
 *     setRows((current) => current.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)))
 *   }
 *   onRemoveRow={(rowId) => setRows((current) => current.filter((r) => r.rowId !== rowId))}
 * />
 * ```
 */
export function ProductQuantityRows({
	rows,
	products,
	quantityLabel = "Cantidad",
	onUpdateRow,
	onRemoveRow,
	leadingColumn,
	extraColumns,
	getRowError,
}: ProductQuantityRowsProps) {
	return (
		<>
			{rows.map((row, index) => {
				const selectedElsewhere = rows.reduce<Set<string>>((acc, other) => {
					if (other.rowId !== row.rowId) acc.add(other.productId);
					return acc;
				}, new Set());
				const availableProducts = products
					.filter(
						(product) =>
							product.id === row.productId ||
							!selectedElsewhere.has(product.id),
					)
					.sort((a, b) => a.name.localeCompare(b.name));
				const rowError = getRowError?.(row);
				return (
					<div key={row.rowId} className="flex flex-col gap-1.5">
						<div className="flex flex-wrap items-end gap-2">
							{leadingColumn && (
								<div
									className={`flex w-full shrink-0 flex-col gap-2 ${leadingColumn.className ?? "sm:w-32"}`}
								>
									<Label className="whitespace-nowrap">
										{leadingColumn.label}
									</Label>
									{leadingColumn.render(row, index)}
								</div>
							)}
							<div className="flex w-full flex-col gap-2 sm:min-w-40 sm:flex-1">
								<Label>Producto</Label>
								<Select
									searchable
									value={row.productId}
									onValueChange={(value) =>
										onUpdateRow(row.rowId, { productId: value ?? "" })
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Selecciona un producto" />
									</SelectTrigger>
									<SelectContent>
										{availableProducts.map((product) => (
											<SelectItem key={product.id} value={product.id}>
												{product.name} ({product.presentation})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="flex w-full shrink-0 flex-col gap-2 sm:w-36">
								<Label className="whitespace-nowrap">{quantityLabel}</Label>
								<Input
									type="number"
									min={1}
									value={row.quantity}
									aria-invalid={rowError ? true : undefined}
									onChange={(event) =>
										onUpdateRow(row.rowId, { quantity: event.target.value })
									}
								/>
							</div>
							{extraColumns?.map((column) => (
								<div
									key={column.label}
									className={`flex w-full shrink-0 flex-col gap-2 ${column.className ?? "sm:w-32"}`}
								>
									<Label className="whitespace-nowrap text-muted-foreground">
										{column.label}
									</Label>
									<div className="flex h-8 items-center justify-between text-sm font-medium sm:justify-end">
										{column.render(row)}
									</div>
								</div>
							))}
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="ml-auto sm:ml-0"
								onClick={() => onRemoveRow(row.rowId)}
								disabled={rows.length === 1}
							>
								<Trash2 className="text-destructive" />
							</Button>
						</div>
						{rowError && <p className="text-destructive text-xs">{rowError}</p>}
					</div>
				);
			})}
		</>
	);
}
