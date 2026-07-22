"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { QuickProductDialog } from "@/modules/inventario/components/quick-product-dialog";
import { useProducts } from "@/modules/inventario/hooks/use-products";
import type { PurchaseOrder } from "@/types";
import type { PurchaseOrderFormValues } from "./purchase-order-form-schema";
import {
	emptyPurchaseOrderLineRow,
	type PurchaseOrderLineRow as OrderLineRow,
} from "./purchase-order-line-row";
import { PurchaseOrderLines } from "./purchase-order-lines";

interface PurchaseOrderFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Si se pasa, el diálogo edita ese pedido en borrador; si no, crea uno nuevo. */
	order?: PurchaseOrder | null;
	onSubmit: (values: PurchaseOrderFormValues) => void;
	isPending?: boolean;
}

function toRows(order?: PurchaseOrder | null): OrderLineRow[] {
	if (!order || order.lines.length === 0) return [emptyPurchaseOrderLineRow()];
	return order.lines.map((line) => ({
		rowId: line.id,
		productId: line.productId,
		purchaseMode: line.purchaseMode,
		quantity: String(line.quantity),
		unitsPerPackage: String(line.unitsPerPackage),
		unitCost: String(line.unitCost),
	}));
}

/**
 * Diálogo de creación/edición de un pedido de compra — varias líneas de producto con cantidad y
 * precio de compra, igual que la extinta "Registrar entrada" pero sin afectar inventario todavía.
 * El pedido queda en "borrador" hasta que se confirme su recepción (`PurchaseOrderReceiveDialog`).
 * El llamador debe montarlo con una `key` que cambie en cada apertura, mismo patrón que
 * `ExpenseFormDialog`.
 */
export function PurchaseOrderFormDialog({
	open,
	onOpenChange,
	order,
	onSubmit,
	isPending,
}: PurchaseOrderFormDialogProps) {
	const products = useProducts();
	const [supplier, setSupplier] = useState(order?.supplier ?? "");
	const [orderDate, setOrderDate] = useState(
		order?.orderDate ?? new Date().toISOString().slice(0, 10),
	);
	const [note, setNote] = useState(order?.note ?? "");
	const [rows, setRows] = useState<OrderLineRow[]>(() => toRows(order));
	const [isSubmitting, setIsSubmitting] = useState(false);

	const updateRow = (rowId: string, patch: Partial<OrderLineRow>) => {
		setRows((current) =>
			current.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row)),
		);
	};

	const removeRow = (rowId: string) => {
		setRows((current) => current.filter((row) => row.rowId !== rowId));
	};

	const addRow = () => {
		setRows((current) => [...current, emptyPurchaseOrderLineRow()]);
	};

	const validRows = rows.filter(
		(row) =>
			row.productId &&
			Number(row.quantity) > 0 &&
			Number(row.unitCost) > 0 &&
			(row.purchaseMode === "unidad" || Number(row.unitsPerPackage) > 0),
	);
	const isValid = supplier.trim() && orderDate && validRows.length > 0;
	const total = validRows.reduce(
		(sum, row) => sum + Number(row.quantity) * Number(row.unitCost),
		0,
	);

	const handleSubmit = async () => {
		if (!isValid) return;
		setIsSubmitting(true);
		try {
			onSubmit({
				supplier: supplier.trim(),
				orderDate,
				note: note.trim() || undefined,
				lines: validRows.map((row) => ({
					productId: row.productId,
					purchaseMode: row.purchaseMode,
					quantity: Number(row.quantity),
					unitsPerPackage:
						row.purchaseMode === "unidad" ? 1 : Number(row.unitsPerPackage),
					unitCost: Number(row.unitCost),
				})),
			});
			onOpenChange(false);
		} finally {
			setIsSubmitting(false);
		}
	};

	const submitting = isPending || isSubmitting;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[calc(100%-2rem)] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>{order ? "Editar pedido" : "Nuevo pedido"}</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="flex flex-col gap-2">
							<Label>Proveedor</Label>
							<Input
								value={supplier}
								onChange={(event) => setSupplier(event.target.value)}
								placeholder="Ej. Distribuidora Andina"
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label>Fecha del pedido</Label>
							<Input
								type="date"
								value={orderDate}
								onChange={(event) => setOrderDate(event.target.value)}
							/>
						</div>
					</div>

					<div className="flex flex-col gap-3">
						<Label>Productos</Label>
						<PurchaseOrderLines
							rows={rows}
							products={products}
							onUpdateRow={updateRow}
							onRemoveRow={removeRow}
						/>
						<div className="flex flex-wrap gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addRow}
								disabled={rows.length >= products.length}
							>
								+ Agregar producto
							</Button>
							<QuickProductDialog
								onCreated={(productId) =>
									setRows((current) => [
										...current,
										{ ...emptyPurchaseOrderLineRow(), productId },
									])
								}
							/>
						</div>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="purchase-order-note">Nota (opcional)</Label>
						<Input
							id="purchase-order-note"
							value={note}
							onChange={(event) => setNote(event.target.value)}
							placeholder="Ej. Entrega los martes"
						/>
					</div>

					<p className="text-right text-sm text-muted-foreground">
						Total del pedido:{" "}
						<span className="font-medium text-foreground">
							{formatCurrency(total)}
						</span>
					</p>
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						disabled={submitting}
						onClick={() => onOpenChange(false)}
					>
						Cancelar
					</Button>
					<Button
						type="button"
						onClick={handleSubmit}
						disabled={!isValid || submitting}
					>
						{order ? "Guardar" : "Crear pedido"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
