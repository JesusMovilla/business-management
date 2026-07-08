"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { CurrencyInput } from "@/components/forms/currency-input";
import {
	emptyProductQuantityRow,
	type ProductQuantityRow,
} from "@/components/forms/product-quantity-row";
import { ProductQuantityRows } from "@/components/forms/product-quantity-rows";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { ProductWithQuantity } from "@/data/repositories/product-repository";
import { formatCurrency } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { CashClosingWithItems } from "@/types";
import { useCashClosingMutations } from "../hooks/use-cash-closings";
import { getBalanceStatus } from "../lib/balance-status";
import { CashClosingReasonDialog } from "./cash-closing-reason-dialog";
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
	const [actualCash, setActualCash] = useState<number | null>(
		closing ? closing.actualCash : null,
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

	const getRowStockError = (row: ProductQuantityRow): string | undefined => {
		const product = productMap.get(row.productId);
		if (!product || !row.productId || Number(row.quantity) <= 0) return;
		// En edición, lo que este cierre ya vendió de este producto vuelve al pool disponible.
		const alreadySold =
			closing?.items.find((item) => item.productId === row.productId)
				?.quantitySold ?? 0;
		const available =
			product.stock.quantity + (mode === "edit" ? alreadySold : 0);
		const quantity = Number(row.quantity);
		if (quantity > available) {
			return `Disponible ${available}, intentas vender ${quantity}.`;
		}
	};

	const stockErrors = rows
		.map((row) => getRowStockError(row))
		.filter((error): error is string => error !== undefined);

	const expectedIncome = validRows.reduce((total, row) => {
		const product = productMap.get(row.productId);
		return product
			? total + Number(row.quantity) * product.pricing.retailPrice
			: total;
	}, 0);

	const difference = actualCash === null ? 0 : actualCash - expectedIncome;
	const hasDifference = actualCash !== null && difference !== 0;

	const canSubmit =
		validRows.length > 0 && actualCash !== null && stockErrors.length === 0;

	const doSubmit = async () => {
		if (actualCash === null) return;
		setIsSubmitting(true);
		const payload = {
			items: validRows.map((row) => ({
				productId: row.productId,
				quantitySold: Number(row.quantity),
			})),
			actualCash,
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

	const backLabel =
		mode === "edit" ? "Volver al detalle" : "Volver a cierre de caja";
	const backLinkClassName =
		"mb-3.5 flex w-fit items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground";

	return (
		<>
			<div className="mb-6">
				{mode === "edit" ? (
					<button
						type="button"
						onClick={() => onSuccess?.()}
						className={backLinkClassName}
					>
						<ArrowLeft className="size-3.5" />
						{backLabel}
					</button>
				) : (
					<Link href="/cierre-caja" className={backLinkClassName}>
						<ArrowLeft className="size-3.5" />
						{backLabel}
					</Link>
				)}
				<h1 className="font-semibold text-2xl tracking-tight">
					{mode === "edit" ? "Editar cierre" : "Nuevo cierre de caja"}
				</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Registra los productos vendidos hoy y concilia el ingreso esperado.
				</p>
			</div>
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
							getRowError={getRowStockError}
							extraColumns={[
								{
									label: "Precio unitario",
									render: (row) => {
										const product = productMap.get(row.productId);
										return product
											? formatCurrency(product.pricing.retailPrice)
											: "—";
									},
								},
								{
									label: "Subtotal",
									render: (row) => {
										const product = productMap.get(row.productId);
										if (!product) return "—";
										const subtotal =
											(Number(row.quantity) || 0) * product.pricing.retailPrice;
										return formatCurrency(subtotal);
									},
								},
							]}
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
							<CurrencyInput
								id="actual-cash"
								value={actualCash}
								onValueChange={setActualCash}
								placeholder="$ 0"
							/>
						</div>
						{actualCash !== null && (
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

			<CashClosingReasonDialog
				open={reasonDialogOpen}
				onOpenChange={setReasonDialogOpen}
				difference={difference}
				reason={reason}
				onReasonChange={setReason}
				onCancel={() => setReasonDialogOpen(false)}
				onConfirm={handleConfirmReason}
			/>
		</>
	);
}
