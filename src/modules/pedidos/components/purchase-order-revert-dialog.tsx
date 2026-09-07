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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PurchaseOrderRevertDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (reason: string) => void;
	isPending?: boolean;
}

/**
 * Diálogo de reversión de recepción de pedido — pide un motivo obligatorio. Revertir devuelve al
 * inventario las unidades recibidas (movimientos `ajuste`), anula el gasto asociado, y marca el
 * pedido como `revertido`, sin borrarlo. Esta acción no se puede deshacer.
 */
export function PurchaseOrderRevertDialog({
	open,
	onOpenChange,
	onConfirm,
	isPending,
}: PurchaseOrderRevertDialogProps) {
	const [reason, setReason] = useState("");

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) setReason("");
				onOpenChange(nextOpen);
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Revertir recepción de pedido</DialogTitle>
					<DialogDescription>
						Las unidades recibidas en este pedido saldrán del inventario, el
						gasto generado quedará anulado, y el pedido quedará marcado como
						revertido, sin eliminar su historial. Esta acción no se puede
						deshacer.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-2">
					<Label htmlFor="revert-reason">Motivo</Label>
					<Textarea
						id="revert-reason"
						value={reason}
						onChange={(event) => setReason(event.target.value)}
						placeholder="Ej: recepción registrada por error, pedido duplicado..."
					/>
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
						variant="destructive"
						disabled={isPending || !reason.trim()}
						onClick={() => {
							onConfirm(reason.trim());
							setReason("");
						}}
					>
						Revertir recepción
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
