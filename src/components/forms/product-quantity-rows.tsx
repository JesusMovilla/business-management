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

interface ProductQuantityRowsProps {
	rows: ProductQuantityRow[];
	products: { id: string; name: string }[];
	/** Label del campo de cantidad, ej. "Cantidad" (entradas) o "Cantidad vendida" (cierre de caja). */
	quantityLabel?: string;
	onUpdateRow: (rowId: string, patch: Partial<ProductQuantityRow>) => void;
	onRemoveRow: (rowId: string) => void;
	/** Contenido adicional por fila (ej. precio unitario y subtotal en cierre de caja). */
	renderRowExtra?: (row: ProductQuantityRow) => ReactNode;
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
	renderRowExtra,
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
				return (
					<div key={row.rowId} className="flex flex-wrap items-end gap-2">
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
						<div className="flex w-20 flex-col gap-2">
							<Label>{quantityLabel}</Label>
							<Input
								type="number"
								min={1}
								value={row.quantity}
								onChange={(event) =>
									onUpdateRow(row.rowId, { quantity: event.target.value })
								}
							/>
						</div>
						{renderRowExtra && (
							<div className="flex w-32 flex-col gap-2">
								{renderRowExtra(row)}
							</div>
						)}
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
				);
			})}
		</>
	);
}
