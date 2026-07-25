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

interface CashClosingRevertDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (reason: string) => void;
	isPending?: boolean;
}

/**
 * Diálogo de reversión de cierre de caja — pide un motivo obligatorio. Revertir devuelve al
 * inventario la cantidad vendida de cada ítem (movimientos `ajuste`) y marca el cierre como
 * `revertido`, sin borrarlo. Esta acción no se puede deshacer.
 */
export function CashClosingRevertDialog({
	open,
	onOpenChange,
	onConfirm,
	isPending,
}: CashClosingRevertDialogProps) {
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
					<DialogTitle>Revertir cierre de caja</DialogTitle>
					<DialogDescription>
						Las cantidades vendidas en este cierre volverán al inventario y el
						cierre quedará marcado como revertido, sin eliminar su historial.
						Esta acción no se puede deshacer.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-2">
					<Label htmlFor="revert-reason">Motivo</Label>
					<Textarea
						id="revert-reason"
						value={reason}
						onChange={(event) => setReason(event.target.value)}
						placeholder="Ej: cierre registrado por error, ventas duplicadas..."
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
						Revertir cierre
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
