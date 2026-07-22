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
	const [receivedDate, setReceivedDate] = useState(
		new Date().toISOString().slice(0, 10),
	);
	const [paymentMethod, setPaymentMethod] = useState("Transferencia");
	const products = useProducts();

	if (!order) return null;
	const total = purchaseOrderTotal(order);
	const productName = (id: string) =>
		products.find((product) => product.id === id)?.name ?? "Producto eliminado";

	const handleConfirm = () => {
		if (!receivedDate || !paymentMethod.trim()) return;
		onConfirm(order.id, { receivedDate, paymentMethod: paymentMethod.trim() });
	};

	return (
		<Dialog open={!!order} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Confirmar recepción del pedido</DialogTitle>
					<DialogDescription>
						Se registrará una entrada de inventario por cada línea, se
						actualizará el costo de cada producto con el precio de esta compra,
						y se generará un gasto por {formatCurrency(total)} en la categoría
						"Compra de mercancía".
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-1.5 rounded-lg border p-3 text-sm">
					{order.lines.map((line) => (
						<div key={line.id} className="flex justify-between gap-2">
							<span>{productName(line.productId)}</span>
							<span className="text-muted-foreground">
								{line.purchaseMode === "paquete"
									? `${line.quantity} paquete(s) × ${line.unitsPerPackage} = `
									: ""}
								{purchaseOrderLineUnits(line)} unidades
							</span>
						</div>
					))}
				</div>
				<div className="flex flex-col gap-4">
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
