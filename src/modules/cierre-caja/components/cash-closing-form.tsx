"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
	emptyProductQuantityRow,
	type ProductQuantityRow,
	ProductQuantityRows,
} from "@/components/forms/product-quantity-rows";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProductWithQuantity } from "@/data/repositories/product-repository";
import { formatCurrency } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { CashClosingWithItems } from "@/types";
import { useCashClosingMutations } from "../hooks/use-cash-closings";
import { getBalanceStatus } from "../lib/balance-status";
import { CashClosingStatusBadge } from "./cash-closing-status-badge";

interface CashClosingFormProps {
	mode: "create" | "edit";
	products: ProductWithQuantity[];
	closing?: CashClosingWithItems;
	/** Solo aplica en `mode="edit"`: se llama tras guardar para volver a la vista de solo lectura. */
	onSuccess?: () => void;
}

function toRows(closing?: CashClosingWithItems): ProductQuantityRow[] {
	if (!closing || closing.items.length === 0)
		return [emptyProductQuantityRow()];
	return closing.items.map((item) => ({
		rowId: crypto.randomUUID(),
		productId: item.productId,
		quantity: String(item.quantitySold),
	}));
}

/**
 * Formulario de un cierre de caja, para crear (`/cierre-caja/nuevo`) y editar (solo admin, inline
 * en `/cierre-caja/[id]`). El cálculo de ingreso esperado/diferencia que se ve aquí es solo una
 * vista previa con los precios ya cargados en el cliente — el cálculo autoritativo (y la validación
 * de stock/motivo obligatorio) ocurre en el servidor, ver `../actions.ts`. El motivo de la
 * diferencia no se pide en el formulario: solo aparece en un modal al intentar registrar, y solo
 * si hay descuadre, para no confundir al usuario con un campo "obligatorio" que la mayoría de las
 * veces no aplica.
 */
export function CashClosingForm({
	mode,
	products,
	closing,
	onSuccess,
}: CashClosingFormProps) {
	const router = useRouter();
	const { createCashClosing, updateCashClosing } = useCashClosingMutations();
	const [rows, setRows] = useState<ProductQuantityRow[]>(() => toRows(closing));
	const [actualCash, setActualCash] = useState(
		closing ? String(closing.actualCash) : "",
	);
	const [reason, setReason] = useState(closing?.reason ?? "");
	const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const productMap = new Map(products.map((product) => [product.id, product]));

	const updateRow = (rowId: string, patch: Partial<ProductQuantityRow>) => {
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

	const stockErrors = validRows
		.map((row) => {
			const product = productMap.get(row.productId);
			if (!product) return null;
			// En edición, lo que este cierre ya vendió de este producto vuelve al pool disponible.
			const alreadySold =
				closing?.items.find((item) => item.productId === row.productId)
					?.quantitySold ?? 0;
			const available =
				product.stock.quantity + (mode === "edit" ? alreadySold : 0);
			const quantity = Number(row.quantity);
			if (quantity > available) {
				return `${product.name}: disponible ${available}, intentas vender ${quantity}.`;
			}
			return null;
		})
		.filter((error): error is string => error !== null);

	const expectedIncome = validRows.reduce((total, row) => {
		const product = productMap.get(row.productId);
		return product
			? total + Number(row.quantity) * product.pricing.retailPrice
			: total;
	}, 0);

	const actualCashNumber = actualCash === "" ? null : Number(actualCash);
	const difference =
		actualCashNumber === null ? 0 : actualCashNumber - expectedIncome;
	const hasDifference = actualCashNumber !== null && difference !== 0;

	const canSubmit =
		validRows.length > 0 &&
		actualCashNumber !== null &&
		stockErrors.length === 0;

	const doSubmit = async () => {
		if (actualCashNumber === null) return;
		setIsSubmitting(true);
		const payload = {
			items: validRows.map((row) => ({
				productId: row.productId,
				quantitySold: Number(row.quantity),
			})),
			actualCash: actualCashNumber,
			reason: reason.trim() || undefined,
		};
		try {
			if (mode === "create") {
				await toast.promise(createCashClosing(payload), {
					loading: "Registrando cierre...",
					success: "Cierre registrado correctamente.",
					error: (err) =>
						err instanceof Error
							? err.message
							: "No se pudo registrar el cierre.",
				});
				router.push("/cierre-caja");
			} else if (closing) {
				await toast.promise(updateCashClosing(closing.id, payload), {
					loading: "Guardando cambios...",
					success: "Cierre actualizado correctamente.",
					error: (err) =>
						err instanceof Error
							? err.message
							: "No se pudo actualizar el cierre.",
				});
				router.refresh();
				onSuccess?.();
			}
		} catch {
			// El toast ya mostró el error; el usuario se queda en el formulario para reintentar.
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!canSubmit) return;
		if (hasDifference) {
			setReasonDialogOpen(true);
			return;
		}
		void doSubmit();
	};

	const handleConfirmReason = () => {
		if (!reason.trim()) return;
		setReasonDialogOpen(false);
		void doSubmit();
	};

	return (
		<>
			<form onSubmit={handleSubmit} className="flex flex-col gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Productos vendidos</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-3">
						<ProductQuantityRows
							rows={rows}
							products={products}
							quantityLabel="Cantidad vendida"
							onUpdateRow={updateRow}
							onRemoveRow={removeRow}
							renderRowExtra={(row) => {
								const product = productMap.get(row.productId);
								if (!product) return null;
								const subtotal =
									(Number(row.quantity) || 0) * product.pricing.retailPrice;
								return (
									<>
										<Label className="text-muted-foreground text-xs">
											{formatCurrency(product.pricing.retailPrice)} c/u
										</Label>
										<p className="text-sm font-medium">
											{formatCurrency(subtotal)}
										</p>
									</>
								);
							}}
						/>
						<div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addRow}
								disabled={rows.length >= products.length}
							>
								+ Agregar producto
							</Button>
						</div>
						{stockErrors.length > 0 && (
							<ul className="text-destructive text-xs">
								{stockErrors.map((error) => (
									<li key={error}>{error}</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Conciliación</CardTitle>
					</CardHeader>
					<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="flex flex-col gap-2">
							<Label>Ingreso esperado</Label>
							<p className="text-lg font-semibold">
								{formatCurrency(expectedIncome)}
							</p>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="actual-cash">Dinero real contado</Label>
							<Input
								id="actual-cash"
								type="number"
								min={0}
								value={actualCash}
								onChange={(event) => setActualCash(event.target.value)}
							/>
						</div>
						{actualCashNumber !== null && (
							<div className="flex flex-col gap-2 sm:col-span-2">
								<Label>Diferencia</Label>
								<div className="flex items-center gap-2">
									<CashClosingStatusBadge
										status={getBalanceStatus(difference)}
									/>
									{difference !== 0 && (
										<span className="text-sm">
											{formatCurrency(Math.abs(difference))}
										</span>
									)}
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				<div className="flex justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						disabled={isSubmitting}
						onClick={() =>
							mode === "create" ? router.push("/cierre-caja") : onSuccess?.()
						}
					>
						Cancelar
					</Button>
					<Button type="submit" disabled={!canSubmit || isSubmitting}>
						{mode === "create" ? "Registrar cierre" : "Guardar cambios"}
					</Button>
				</div>
			</form>

			<Dialog open={reasonDialogOpen} onOpenChange={setReasonDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							El dinero real no coincide con lo esperado
						</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-3">
						<div className="flex items-center gap-2">
							<CashClosingStatusBadge status={getBalanceStatus(difference)} />
							<span className="text-sm">
								{formatCurrency(Math.abs(difference))}
							</span>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="reason-dialog">Motivo de la diferencia</Label>
							<Textarea
								id="reason-dialog"
								value={reason}
								onChange={(event) => setReason(event.target.value)}
								placeholder="Ej. Faltó dar el vuelto correcto en una venta."
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setReasonDialogOpen(false)}
						>
							Cancelar
						</Button>
						<Button
							type="button"
							onClick={handleConfirmReason}
							disabled={!reason.trim()}
						>
							Confirmar y registrar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
