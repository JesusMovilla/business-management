"use client";

import { Trash2 } from "lucide-react";
import { CurrencyInput } from "@/components/forms/currency-input";
import { Button } from "@/components/ui/button";
import { DebtorPicker } from "./debtor-picker";

export interface DifferenceRowValue {
	id: string;
	debtorId?: string;
	newDebtorName?: string;
	displayName: string;
	amount: number | null;
}

interface CashClosingDifferenceRowProps {
	row: DifferenceRowValue;
	onChange: (id: string, patch: Partial<DifferenceRowValue>) => void;
	onRemove: (id: string) => void;
	canRemove: boolean;
	disabled?: boolean;
}

/** Una fila del diálogo de asignación de diferencia: persona (`DebtorPicker`) + monto asignado. */
export function CashClosingDifferenceRow({
	row,
	onChange,
	onRemove,
	canRemove,
	disabled,
}: CashClosingDifferenceRowProps) {
	return (
		<div className="flex flex-col gap-2 sm:flex-row sm:items-start">
			<div className="flex-1">
				<DebtorPicker
					displayName={row.displayName}
					disabled={disabled}
					onChange={(value) => onChange(row.id, value)}
				/>
			</div>
			<div className="flex items-center gap-2">
				<CurrencyInput
					value={row.amount}
					onValueChange={(amount) => onChange(row.id, { amount })}
					placeholder="$ 0"
					disabled={disabled}
					className="w-36"
				/>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					disabled={disabled || !canRemove}
					onClick={() => onRemove(row.id)}
				>
					<Trash2 className="size-4" />
				</Button>
			</div>
		</div>
	);
}
