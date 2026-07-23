"use client";

import { Trash2 } from "lucide-react";
import { CurrencyInput } from "@/components/forms/currency-input";
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
import { cn } from "@/lib/utils";
import type { PurchaseOrderLineRow } from "./purchase-order-line-row";

interface PurchaseOrderLinesProps {
	rows: PurchaseOrderLineRow[];
	products: { id: string; name: string }[];
	onUpdateRow: (rowId: string, patch: Partial<PurchaseOrderLineRow>) => void;
	onRemoveRow: (rowId: string) => void;
}

/**
 * Líneas de producto de un pedido — a diferencia de `ProductQuantityRows` (Inventario/Cierre de
 * caja), cada línea distingue si se compró **por paquete** o **por unidad**, porque el sistema
 * vende por unidad pero la compra a veces viene empacada (ej. 33 unidades por paquete). En modo
 * "paquete" el usuario escribe manualmente cuántas unidades trae ese paquete (no hay valor por
 * defecto en el producto — ver docs/DECISIONS.md); en modo "unidad" ese campo no aplica. El total
 * de unidades que entrará a inventario (`cantidad × unidades por paquete`) se muestra en vivo
 * junto al precio para evitar confusiones.
 */
export function PurchaseOrderLines({
	rows,
	products,
	onUpdateRow,
	onRemoveRow,
}: PurchaseOrderLinesProps) {
	return (
		<div className="flex flex-col gap-3">
			{rows.map((row) => {
				const selectedElsewhere = rows.reduce<Set<string>>((acc, other) => {
					if (other.rowId !== row.rowId) acc.add(other.productId);
					return acc;
				}, new Set());
				const availableProducts = products.filter(
					(product) =>
						product.id === row.productId || !selectedElsewhere.has(product.id),
				);
				const isPaquete = row.purchaseMode === "paquete";
				const totalUnits =
					Number(row.quantity) > 0 &&
					(!isPaquete || Number(row.unitsPerPackage) > 0)
						? Number(row.quantity) *
							(isPaquete ? Number(row.unitsPerPackage) : 1)
						: null;

				return (
					<div
						key={row.rowId}
						className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4"
					>
						<div className="flex flex-wrap items-end gap-3">
							<div className="flex min-w-48 flex-1 flex-col gap-1.5">
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
							<div className="flex w-36 shrink-0 flex-col gap-1.5">
								<Label>Se compró por</Label>
								<Select
									value={row.purchaseMode}
									onValueChange={(value) =>
										onUpdateRow(row.rowId, {
											purchaseMode:
												value as PurchaseOrderLineRow["purchaseMode"],
										})
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="paquete">Paquete</SelectItem>
										<SelectItem value="unidad">Unidad</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="shrink-0"
								onClick={() => onRemoveRow(row.rowId)}
								disabled={rows.length === 1}
							>
								<Trash2 className="text-destructive" />
							</Button>
						</div>

						<div
							className={cn(
								"grid grid-cols-2 gap-3",
								isPaquete ? "sm:grid-cols-3" : "sm:grid-cols-2",
							)}
						>
							<div className="flex flex-col gap-1.5">
								<Label className="whitespace-nowrap">
									{isPaquete ? "Paquetes" : "Unidades"}
								</Label>
								<Input
									type="number"
									min={1}
									step={1}
									value={row.quantity}
									onChange={(event) =>
										onUpdateRow(row.rowId, { quantity: event.target.value })
									}
								/>
							</div>
							{isPaquete && (
								<div className="flex flex-col gap-1.5">
									<Label className="whitespace-nowrap">
										Unidades por paquete
									</Label>
									<Input
										type="number"
										min={1}
										step={1}
										value={row.unitsPerPackage}
										onChange={(event) =>
											onUpdateRow(row.rowId, {
												unitsPerPackage: event.target.value,
											})
										}
									/>
								</div>
							)}
							<div className="flex flex-col gap-1.5">
								<Label className="whitespace-nowrap">
									Precio {isPaquete ? "por paquete" : "por unidad"}
								</Label>
								<CurrencyInput
									value={row.unitCost ? Number(row.unitCost) : null}
									onValueChange={(value) =>
										onUpdateRow(row.rowId, {
											unitCost: value === null ? "" : String(value),
										})
									}
								/>
							</div>
						</div>

						{isPaquete && totalUnits !== null && (
							<p className="text-right text-muted-foreground text-xs">
								={" "}
								<span className="font-medium text-foreground">
									{totalUnits}
								</span>{" "}
								unidades
							</p>
						)}
					</div>
				);
			})}
		</div>
	);
}
