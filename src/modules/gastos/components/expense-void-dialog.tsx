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
import type { Expense } from "@/types";

interface ExpenseVoidDialogProps {
	expense: Expense | null;
	onOpenChange: (open: boolean) => void;
	onConfirm: (id: string, reason: string) => void;
	isPending?: boolean;
}

/** Diálogo de anulación de gasto — pide un motivo obligatorio, nunca borra el registro. */
export function ExpenseVoidDialog({
	expense,
	onOpenChange,
	onConfirm,
	isPending,
}: ExpenseVoidDialogProps) {
	const [reason, setReason] = useState("");

	return (
		<Dialog
			open={!!expense}
			onOpenChange={(open) => {
				if (!open) setReason("");
				onOpenChange(open);
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Anular gasto</DialogTitle>
					<DialogDescription>
						&quot;{expense?.description}&quot; quedará marcado como anulado, sin
						eliminar su historial. Esta acción no se puede deshacer.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-2">
					<Label htmlFor="void-reason">Motivo</Label>
					<Textarea
						id="void-reason"
						value={reason}
						onChange={(event) => setReason(event.target.value)}
						placeholder="Ej: registrado por error, duplicado..."
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
							if (!expense) return;
							onConfirm(expense.id, reason.trim());
							setReason("");
						}}
					>
						Anular gasto
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
