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
import type { ProfitPayout } from "@/types";

interface ProfitPayoutVoidDialogProps {
	payout: ProfitPayout | null;
	onOpenChange: (open: boolean) => void;
	onConfirm: (id: string, reason: string) => void;
	isPending?: boolean;
}

/** Diálogo de anulación de pago — pide un motivo obligatorio, nunca borra el registro. */
export function ProfitPayoutVoidDialog({
	payout,
	onOpenChange,
	onConfirm,
	isPending,
}: ProfitPayoutVoidDialogProps) {
	const [reason, setReason] = useState("");

	return (
		<Dialog
			open={!!payout}
			onOpenChange={(open) => {
				if (!open) setReason("");
				onOpenChange(open);
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Anular pago</DialogTitle>
					<DialogDescription>
						&quot;{payout?.note}&quot; quedará marcado como anulado, sin
						eliminar su historial. Esta acción no se puede deshacer.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-2">
					<Label htmlFor="payout-void-reason">Motivo</Label>
					<Textarea
						id="payout-void-reason"
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
							if (!payout) return;
							onConfirm(payout.id, reason.trim());
							setReason("");
						}}
					>
						Anular pago
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
