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
import { formatCurrency } from "@/lib/format";
import type { DebtorAllocationInput, DebtorMovementType } from "@/types";
import { getBalanceStatus } from "../lib/balance-status";
import {
	CashClosingDifferenceRow,
	type DifferenceRowValue,
} from "./cash-closing-difference-row";
import { CashClosingStatusBadge } from "./cash-closing-status-badge";

interface CashClosingDifferenceDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	difference: number;
	reason: string;
	onReasonChange: (reason: string) => void;
	onCancel: () => void;
	onConfirm: (allocations: DebtorAllocationInput[]) => void;
	isSubmitting?: boolean;
}

/**
 * Modal que aparece al finalizar un cierre con diferencia: pide el motivo (igual que antes,
 * `CashClosingReasonDialog`) y, además, permite asignar el monto a una o más personas — quien
 * fio (faltante) o a quien se le abonó una deuda previa (sobrante). Asignar a un deudor es
 * siempre **opcional**: un faltante puede deberse a cualquier otro motivo, no solo a que alguien
 * fio, así que no se fuerza a cubrir el 100% — el campo "deudor" ni siquiera se muestra hasta que
 * se presiona "Agregar deudor". Si se asigna al menos una fila válida, el motivo de texto libre
 * deja de ser obligatorio (asignar a alguien ya explica la diferencia). Ver `docs/DECISIONS.md`.
 */
export function CashClosingDifferenceDialog({
	open,
	onOpenChange,
	difference,
	reason,
	onReasonChange,
	onCancel,
	onConfirm,
	isSubmitting,
}: CashClosingDifferenceDialogProps) {
	const [rows, setRows] = useState<DifferenceRowValue[]>([]);
	const isShortage = difference < 0;
	const allocationType: DebtorMovementType = isShortage ? "deuda" : "abono";

	// Se reinicia cada vez que se abre — el usuario no debería ver filas de un intento anterior.
	// Ajustado en el render (no en un efecto) para no mostrar un frame con filas viejas antes de
	// limpiarlas — ver https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
	const [prevOpen, setPrevOpen] = useState(open);
	if (open !== prevOpen) {
		setPrevOpen(open);
		if (open) setRows([]);
	}

	const assigned = rows.reduce((sum, row) => sum + (row.amount ?? 0), 0);
	const remaining = Math.round(Math.abs(difference) - assigned);
	const validRows = rows.filter(
		(row) =>
			(row.debtorId || row.newDebtorName?.trim()) &&
			row.amount &&
			row.amount > 0,
	);
	const hasIncompleteRow = rows.some((row) => {
		const hasPerson = Boolean(row.debtorId || row.newDebtorName?.trim());
		const hasAmount = Boolean(row.amount && row.amount > 0);
		return (hasPerson || hasAmount) && !(hasPerson && hasAmount);
	});
	const reasonRequired = validRows.length === 0;
	const canConfirm =
		!hasIncompleteRow &&
		remaining >= 0 &&
		(!reasonRequired || reason.trim().length > 0);

	const updateRow = (id: string, patch: Partial<DifferenceRowValue>) => {
		setRows((prev) =>
			prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
		);
	};
	const removeRow = (id: string) => {
		setRows((prev) => prev.filter((row) => row.id !== id));
	};
	const addRow = () =>
		setRows((prev) => [
			...prev,
			{ id: crypto.randomUUID(), displayName: "", amount: null },
		]);

	const handleConfirm = () => {
		if (!canConfirm) return;
		const allocations: DebtorAllocationInput[] = validRows.map((row) => ({
			debtorId: row.debtorId,
			newDebtorName: row.newDebtorName?.trim() || undefined,
			amount: row.amount as number,
			type: allocationType,
		}));
		onConfirm(allocations);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>El dinero real no coincide con lo esperado</DialogTitle>
					<DialogDescription>
						{isShortage
							? "Si alguien fio, agrégalo para llevar el seguimiento. Si el faltante es por otro motivo, basta con explicarlo abajo."
							: "Si el sobrante corresponde a un abono de una deuda anterior, agrégalo aquí. Si no, déjalo sin asignar y explica el motivo."}
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					<div className="flex items-center gap-2">
						<CashClosingStatusBadge status={getBalanceStatus(difference)} />
						<span className="text-sm">
							{formatCurrency(Math.abs(difference))}
						</span>
					</div>

					<div className="flex flex-col gap-3">
						{rows.map((row) => (
							<CashClosingDifferenceRow
								key={row.id}
								row={row}
								onChange={updateRow}
								onRemove={removeRow}
								canRemove
								disabled={isSubmitting}
							/>
						))}
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="self-start"
							onClick={addRow}
							disabled={isSubmitting}
						>
							Agregar deudor
						</Button>
					</div>

					{rows.length > 0 && (
						<p className="text-muted-foreground text-sm">
							Asignado {formatCurrency(assigned)} de{" "}
							{formatCurrency(Math.abs(difference))}
							{remaining > 0 && " — el resto queda sin asignar"}
						</p>
					)}

					<div className="flex flex-col gap-2">
						<Label htmlFor="difference-reason">
							Motivo de la diferencia{!reasonRequired && " (opcional)"}
						</Label>
						<Textarea
							id="difference-reason"
							value={reason}
							onChange={(event) => onReasonChange(event.target.value)}
							placeholder="Ej. Faltó dar el vuelto correcto en una venta."
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
						disabled={isSubmitting}
					>
						Cancelar
					</Button>
					<Button
						type="button"
						onClick={handleConfirm}
						disabled={!canConfirm || isSubmitting}
					>
						Confirmar y finalizar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
