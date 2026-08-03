"use client";

import { useState } from "react";
import {
	emptyProductQuantityRow,
	type ProductQuantityRow,
} from "@/components/forms/product-quantity-row";
import { ProductQuantityRows } from "@/components/forms/product-quantity-rows";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ProductWithQuantity } from "@/data/repositories/product-repository";
import { formatCurrency } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { CashClosingItem } from "@/types";
import { updateCashClosingDraftDate } from "../hooks/use-cash-closings";
import { PAYMENT_METHODS } from "../lib/payment-methods";

interface CashClosingRegisterSaleCardProps {
	draftId: string;
	initialDate: string;
	products: ProductWithQuantity[];
	items: CashClosingItem[];
	addSale: (
		saleItems: { productId: string; quantitySold: number }[],
		paymentMethod: string,
		note?: string,
	) => void;
	isPending: boolean;
}

/**
 * Card "Registrar venta": la fecha del cierre (primera columna de la fila, junto a
 * producto/cantidad/precio/subtotal), una o más líneas de producto y el método de
 * pago/observación de la venta. Al confirmar, llama `addSale` y limpia el formulario para la
 * siguiente venta.
 */
export function CashClosingRegisterSaleCard({
	draftId,
	initialDate,
	products,
	items,
	addSale,
	isPending,
}: CashClosingRegisterSaleCardProps) {
	const [rows, setRows] = useState<ProductQuantityRow[]>(() => [
		emptyProductQuantityRow(),
	]);
	const [date, setDate] = useState(initialDate);
	const [isSavingDate, setIsSavingDate] = useState(false);
	const [paymentMethod, setPaymentMethod] = useState("Efectivo");
	const [note, setNote] = useState("");

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
		const quantity = Number(row.quantity);
		if (!product || !row.productId || quantity <= 0) return;
		const alreadyInDraft = items
			.filter((item) => item.productId === row.productId)
			.reduce((sum, item) => sum + item.quantitySold, 0);
		const available = product.stock.quantity - alreadyInDraft;
		if (quantity > available) {
			return `Disponible ${available}, intentas vender ${quantity}.`;
		}
	};

	const stockErrors = rows
		.map((row) => getRowStockError(row))
		.filter((error): error is string => error !== undefined);

	const saleTotal = validRows.reduce((total, row) => {
		const product = productMap.get(row.productId);
		return product
			? total + Number(row.quantity) * product.pricing.retailPrice
			: total;
	}, 0);

	const canAddSale =
		validRows.length > 0 && stockErrors.length === 0 && !!paymentMethod.trim();

	const handleAddSale = () => {
		if (!canAddSale) return;
		addSale(
			validRows.map((row) => ({
				productId: row.productId,
				quantitySold: Number(row.quantity),
			})),
			paymentMethod.trim(),
			note.trim() || undefined,
		);
		setRows([emptyProductQuantityRow()]);
		setNote("");
	};

	const handleDateChange = async (value: string) => {
		setDate(value);
		setIsSavingDate(true);
		try {
			await toast.promise(updateCashClosingDraftDate(draftId, value), {
				loading: "Actualizando fecha...",
				success: "Fecha actualizada.",
				error: (err) =>
					err instanceof Error
						? err.message
						: "No se pudo actualizar la fecha.",
			});
		} catch {
			// El toast ya mostró el error.
		} finally {
			setIsSavingDate(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Registrar venta</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<ProductQuantityRows
					rows={rows}
					products={products}
					quantityLabel="Cantidad vendida"
					onUpdateRow={updateRow}
					onRemoveRow={removeRow}
					getRowError={getRowStockError}
					leadingColumn={{
						label: "Fecha",
						className: "w-40",
						render: (_row, index) =>
							index === 0 ? (
								<Input
									id="closing-date"
									type="date"
									value={date}
									disabled={isSavingDate}
									onChange={(event) =>
										void handleDateChange(event.target.value)
									}
								/>
							) : (
								<div className="flex h-8 items-center text-muted-foreground text-sm">
									—
								</div>
							),
					}}
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

				<div className="grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
					<div className="flex flex-col gap-2">
						<Label htmlFor="payment-method">Método de pago</Label>
						<Select
							value={paymentMethod}
							onValueChange={(value) => setPaymentMethod(value ?? "")}
						>
							<SelectTrigger id="payment-method" className="w-full">
								<SelectValue placeholder="Selecciona un método de pago" />
							</SelectTrigger>
							<SelectContent>
								{PAYMENT_METHODS.map((method) => (
									<SelectItem key={method} value={method}>
										{method}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="sale-note">Observación (opcional)</Label>
						<Input
							id="sale-note"
							value={note}
							placeholder="Ej: nombre del cliente, mesa 4, pedido para llevar"
							onChange={(event) => setNote(event.target.value)}
						/>
					</div>
				</div>

				<div className="flex items-center justify-between">
					<span className="text-sm font-medium">
						Total de esta venta: {formatCurrency(saleTotal)}
					</span>
					<Button
						type="button"
						onClick={handleAddSale}
						disabled={!canAddSale || isPending}
					>
						Registrar venta
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
