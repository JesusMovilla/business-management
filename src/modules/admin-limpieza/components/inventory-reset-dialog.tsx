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

interface InventoryResetDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (reason: string) => void;
	affectedCount: number;
	isPending?: boolean;
}

/**
 * Diálogo de confirmación para "Limpiar inventario" — pide un motivo obligatorio, igual que
 * `CashClosingRevertDialog`. Lleva la cantidad de todos los productos a 0 insertando un
 * movimiento `ajuste` compensatorio por cada uno (el ledger `stock_movements` es append-only, no
 * se borra nada). Esta acción no se puede deshacer — solo revertirse manualmente registrando
 * nuevos movimientos de entrada.
 */
export function InventoryResetDialog({
	open,
	onOpenChange,
	onConfirm,
	affectedCount,
	isPending,
}: InventoryResetDialogProps) {
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
					<DialogTitle>Limpiar inventario</DialogTitle>
					<DialogDescription>
						{affectedCount > 0 ? (
							<>
								La cantidad de <strong>{affectedCount}</strong>{" "}
								{affectedCount === 1 ? "producto quedará" : "productos quedará"}{" "}
								en 0. Se registra un movimiento de ajuste por cada uno, sin
								borrar el historial de movimientos existente. Esta acción no se
								puede deshacer.
							</>
						) : (
							"Todos los productos ya están en 0 — no hay nada para limpiar."
						)}
					</DialogDescription>
				</DialogHeader>
				{affectedCount > 0 && (
					<div className="flex flex-col gap-2">
						<Label htmlFor="inventory-reset-reason">Motivo</Label>
						<Textarea
							id="inventory-reset-reason"
							value={reason}
							onChange={(event) => setReason(event.target.value)}
							placeholder="Ej: cierre de temporada, migración de catálogo..."
						/>
					</div>
				)}
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						disabled={isPending}
						onClick={() => onOpenChange(false)}
					>
						Cancelar
					</Button>
					{affectedCount > 0 && (
						<Button
							type="button"
							variant="destructive"
							disabled={isPending || !reason.trim()}
							onClick={() => {
								onConfirm(reason.trim());
								setReason("");
							}}
						>
							Limpiar inventario
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
