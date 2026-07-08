"use client";

import { Trash2 } from "lucide-react";
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
	products: { id: string; name: string }[];
	/** Label del campo de cantidad, ej. "Cantidad" (entradas) o "Cantidad vendida" (cierre de caja). */
	quantityLabel?: string;
	onUpdateRow: (rowId: string, patch: Partial<ProductQuantityRow>) => void;
	onRemoveRow: (rowId: string) => void;
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
	extraColumns,
	getRowError,
}: ProductQuantityRowsProps) {
	return (
		<>
			{rows.map((row) => {
				const selectedElsewhere = rows.reduce<Set<string>>((acc, other) => {
					if (other.rowId !== row.rowId) acc.add(other.productId);
					return acc;
				}, new Set());
				const availableProducts = products.filter(
					(product) =>
						product.id === row.productId || !selectedElsewhere.has(product.id),
				);
				const rowError = getRowError?.(row);
				return (
					<div key={row.rowId} className="flex flex-col gap-1.5">
						<div className="flex flex-wrap items-end gap-2">
							<div className="flex min-w-40 flex-1 flex-col gap-2">
								<Label>Producto</Label>
								<Select
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
												{product.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="flex w-36 shrink-0 flex-col gap-2">
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
									className="flex w-32 shrink-0 flex-col gap-2"
								>
									<Label className="whitespace-nowrap text-muted-foreground">
										{column.label}
									</Label>
									<div className="flex h-8 items-center justify-end text-sm font-medium">
										{column.render(row)}
									</div>
								</div>
							))}
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								onClick={() => onRemoveRow(row.rowId)}
								disabled={rows.length === 1}
							>
								<Trash2 className="text-destructive" />
							</Button>
						</div>
						{rowError && (
							<p className="text-destructive text-xs">{rowError}</p>
						)}
					</div>
				);
			})}
		</>
	);
}
