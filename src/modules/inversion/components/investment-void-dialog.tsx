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
import type { Investment } from "@/types";

interface InvestmentVoidDialogProps {
	investment: Investment | null;
	onOpenChange: (open: boolean) => void;
	onConfirm: (id: string, reason: string) => void;
	isPending?: boolean;
}

/** Diálogo de anulación de inversión — pide un motivo obligatorio, nunca borra el registro. */
export function InvestmentVoidDialog({
	investment,
	onOpenChange,
	onConfirm,
	isPending,
}: InvestmentVoidDialogProps) {
	const [reason, setReason] = useState("");

	return (
		<Dialog
			open={!!investment}
			onOpenChange={(open) => {
				if (!open) setReason("");
				onOpenChange(open);
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Anular inversión</DialogTitle>
					<DialogDescription>
						&quot;{investment?.description}&quot; quedará marcada como anulada,
						sin eliminar su historial. Esta acción no se puede deshacer.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-2">
					<Label htmlFor="investment-void-reason">Motivo</Label>
					<Textarea
						id="investment-void-reason"
						value={reason}
						onChange={(event) => setReason(event.target.value)}
						placeholder="Ej: registrada por error, duplicada..."
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
							if (!investment) return;
							onConfirm(investment.id, reason.trim());
							setReason("");
						}}
					>
						Anular inversión
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
