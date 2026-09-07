"use client";

import { useState } from "react";
import { CurrencyInput } from "@/components/forms/currency-input";
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
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import type { Debtor } from "@/types";

interface DebtorPaymentDialogProps {
	debtor: Debtor | null;
	onOpenChange: (open: boolean) => void;
	onConfirm: (amount: number, date: string, note?: string) => void;
	isPending?: boolean;
}

function today(): string {
	return new Date().toISOString().slice(0, 10);
}

/** Diálogo "Registrar abono" — nunca deja que el monto supere el balance pendiente, y nunca
 * elimina al deudor: si el abono cubre toda la deuda, su balance simplemente queda en 0. */
export function DebtorPaymentDialog({
	debtor,
	onOpenChange,
	onConfirm,
	isPending,
}: DebtorPaymentDialogProps) {
	const [amount, setAmount] = useState<number | null>(null);
	const [date, setDate] = useState(today());
	const [note, setNote] = useState("");

	const reset = () => {
		setAmount(null);
		setDate(today());
		setNote("");
	};

	const exceedsBalance = debtor !== null && !!amount && amount > debtor.balance;
	const canConfirm = !!debtor && !!amount && amount > 0 && !exceedsBalance;

	return (
		<Dialog
			open={!!debtor}
			onOpenChange={(open) => {
				if (!open) reset();
				onOpenChange(open);
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Registrar abono</DialogTitle>
					<DialogDescription>
						{debtor && (
							<>
								&quot;{debtor.name}&quot; debe actualmente{" "}
								{formatCurrency(debtor.balance)}. Si abona todo, su balance
								queda en 0 sin eliminarlo del listado.
							</>
						)}
					</DialogDescription>
				</DialogHeader>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div className="flex flex-col gap-2">
						<Label htmlFor="payment-amount">Monto del abono</Label>
						<CurrencyInput
							id="payment-amount"
							value={amount}
							onValueChange={setAmount}
							placeholder="$ 0"
						/>
						{exceedsBalance && (
							<p className="text-destructive text-xs">
								No puede superar la deuda pendiente.
							</p>
						)}
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="payment-date">Fecha</Label>
						<Input
							id="payment-date"
							type="date"
							value={date}
							onChange={(event) => setDate(event.target.value)}
						/>
					</div>
					<div className="col-span-full flex flex-col gap-2">
						<Label htmlFor="payment-note">Nota (opcional)</Label>
						<Textarea
							id="payment-note"
							value={note}
							onChange={(event) => setNote(event.target.value)}
							placeholder="Ej: pagó en efectivo el sábado."
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
						disabled={isPending || !canConfirm}
						onClick={() => {
							if (!amount) return;
							onConfirm(amount, date, note.trim() || undefined);
							reset();
						}}
					>
						Registrar abono
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
