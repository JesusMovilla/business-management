"use client";

import { useState } from "react";
import {
	type ProductQuantityRow as EntradaRow,
	emptyProductQuantityRow,
} from "@/components/forms/product-quantity-row";
import { ProductQuantityRows } from "@/components/forms/product-quantity-rows";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { useProducts } from "../hooks/use-products";
import { useStockMovementMutations } from "../hooks/use-stock-movements";
import { QuickProductDialog } from "./quick-product-dialog";

/**
 * Diálogo para registrar entradas de varios productos a la vez (ej. una compra con varias
 * líneas). Cada línea se registra como un movimiento `entrada` independiente en el producto
 * correspondiente, todos con la misma nota — la trazabilidad queda igual que un registro manual,
 * solo que en un solo paso. Requiere permiso `inventario.crear`. Ver `docs/MODULES.md`.
 */
export function BulkEntradaDialog() {
	const [open, setOpen] = useState(false);
	const [rows, setRows] = useState<EntradaRow[]>([emptyProductQuantityRow()]);
	const [note, setNote] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const products = useProducts();
	const { registerBulkEntrada } = useStockMovementMutations();

	const reset = () => {
		setRows([emptyProductQuantityRow()]);
		setNote("");
	};

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) reset();
		setOpen(nextOpen);
	};

	const updateRow = (rowId: string, patch: Partial<EntradaRow>) => {
		setRows((current) =>
			current.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row)),
		);
	};

	const removeRow = (rowId: string) => {
		setRows((current) => current.filter((row) => row.rowId !== rowId));
	};

	const addRow = () => {
		setRows((current) => [...current, emptyProductQuantityRow()]);
	};

	const validRows = rows.filter(
		(row) => row.productId && Number(row.quantity) > 0,
	);
	const isValid = validRows.length > 0;

	const handleSubmit = async () => {
		if (!isValid) return;
		setIsSubmitting(true);
		try {
			await toast.promise(
				registerBulkEntrada(
					validRows.map((row) => ({
						productId: row.productId,
						quantity: Number(row.quantity),
					})),
					note || undefined,
				),
				{
					loading: "Registrando entradas...",
					success:
						validRows.length === 1
							? "Entrada registrada correctamente."
							: `${validRows.length} entradas registradas correctamente.`,
					error: (err) =>
						err instanceof Error
							? err.message
							: "No se pudieron registrar las entradas.",
				},
			);
			handleOpenChange(false);
		} catch {
			// El toast ya mostró el error.
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger render={<Button type="button" />}>
				+ Registrar entrada
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Registrar entrada de productos</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-3">
					<ProductQuantityRows
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
									{ ...emptyProductQuantityRow(), productId },
								])
							}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="bulk-entrada-note">Nota (opcional)</Label>
						<Input
							id="bulk-entrada-note"
							value={note}
							onChange={(event) => setNote(event.target.value)}
							placeholder="Ej. Compra proveedor Bavaria S.A."
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						type="button"
						onClick={handleSubmit}
						disabled={!isValid || isSubmitting}
					>
						Registrar entradas
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
