"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { useProducts } from "@/modules/inventario/hooks/use-products";
import type { PurchaseOrder } from "@/types";
import { purchaseOrderLineUnits, purchaseOrderTotal } from "@/types";
import type { ReceivePurchaseOrderValues } from "./purchase-order-form-schema";

interface PurchaseOrderReceiveDialogProps {
	order: PurchaseOrder | null;
	onOpenChange: (open: boolean) => void;
	onConfirm: (id: string, values: ReceivePurchaseOrderValues) => void;
	isPending?: boolean;
}

/**
 * Confirma la recepción de un pedido en borrador: al aceptar, genera la entrada de inventario por
 * cada línea y un gasto por el total (categoría "Compra de mercancía"), fechados con la fecha de
 * recepción elegida aquí. Acción irreversible desde la UI — un pedido recibido no se puede editar.
 */
export function PurchaseOrderReceiveDialog({
	order,
	onOpenChange,
	onConfirm,
	isPending,
}: PurchaseOrderReceiveDialogProps) {
	const [receivedDate, setReceivedDate] = useState(() =>
		new Date().toISOString().slice(0, 10),
	);
	const [paymentMethod, setPaymentMethod] = useState("Transferencia");
	const products = useProducts();

	if (!order) return null;
	const total = purchaseOrderTotal(order);
	const productName = (id: string) => {
		const product = products.find((p) => p.id === id);
		if (!product) return "Producto eliminado";
		return `${product.name} (${product.presentation})`;
	};

	const handleConfirm = () => {
		if (!receivedDate || !paymentMethod.trim()) return;
		onConfirm(order.id, { receivedDate, paymentMethod: paymentMethod.trim() });
	};

	return (
		<Dialog open={!!order} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Confirmar recepción del pedido</DialogTitle>
					<DialogDescription>
						Genera la entrada de inventario y el gasto de compra
						correspondiente.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					<div className="rounded-lg border">
						<div className="divide-y">
							{order.lines.map((line) => (
								<div
									key={line.id}
									className="flex items-center justify-between gap-3 p-2.5 text-sm"
								>
									<div className="min-w-0">
										<p className="truncate font-medium">
											{productName(line.productId)}
										</p>
										{line.purchaseMode === "paquete" && (
											<p className="text-muted-foreground text-xs">
												{line.quantity} paquete(s) × {line.unitsPerPackage}
											</p>
										)}
									</div>
									<p className="shrink-0 tabular-nums text-muted-foreground">
										<span className="font-medium text-foreground">
											{purchaseOrderLineUnits(line)}
										</span>{" "}
										unidades
									</p>
								</div>
							))}
						</div>
						<div className="flex items-center justify-between gap-3 border-t bg-muted/30 p-2.5 text-sm">
							<span className="text-muted-foreground">Total de la compra</span>
							<span className="font-medium">{formatCurrency(total)}</span>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="flex flex-col gap-2">
							<Label>Fecha de recepción</Label>
							<Input
								type="date"
								value={receivedDate}
								onChange={(event) => setReceivedDate(event.target.value)}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label>Método de pago del gasto</Label>
							<Input
								value={paymentMethod}
								onChange={(event) => setPaymentMethod(event.target.value)}
								placeholder="Ej: Efectivo, transferencia"
							/>
						</div>
					</div>

					<p className="text-muted-foreground text-xs">
						Se actualizará el costo de cada producto con el precio de esta
						compra y el gasto quedará registrado en la categoría "Compra de
						mercancía".
					</p>
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						disabled={isPending}
						onClick={() => onOpenChange(false)}
					>
						Cancelar
					</Button>
					<Button
						type="button"
						disabled={isPending || !receivedDate || !paymentMethod.trim()}
						onClick={handleConfirm}
					>
						Confirmar recepción
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
