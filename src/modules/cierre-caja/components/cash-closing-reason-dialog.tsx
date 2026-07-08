"use client";

import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { getBalanceStatus } from "../lib/balance-status";
import { CashClosingStatusBadge } from "./cash-closing-status-badge";

interface CashClosingReasonDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	difference: number;
	reason: string;
	onReasonChange: (reason: string) => void;
	onCancel: () => void;
	onConfirm: () => void;
}

/** Modal que pide el motivo de la diferencia solo cuando el dinero real no coincide con lo esperado. */
export function CashClosingReasonDialog({
	open,
	onOpenChange,
	difference,
	reason,
	onReasonChange,
	onCancel,
	onConfirm,
}: CashClosingReasonDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>El dinero real no coincide con lo esperado</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-2">
						<CashClosingStatusBadge status={getBalanceStatus(difference)} />
						<span className="text-sm">
							{formatCurrency(Math.abs(difference))}
						</span>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="reason-dialog">Motivo de la diferencia</Label>
						<Textarea
							id="reason-dialog"
							value={reason}
							onChange={(event) => onReasonChange(event.target.value)}
							placeholder="Ej. Faltó dar el vuelto correcto en una venta."
						/>
					</div>
				</div>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancelar
					</Button>
					<Button type="button" onClick={onConfirm} disabled={!reason.trim()}>
						Confirmar y registrar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
