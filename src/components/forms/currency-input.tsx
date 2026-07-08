"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";

type CurrencyInputProps = Omit<
	ComponentProps<typeof Input>,
	"type" | "value" | "onChange"
> & {
	value: number | null;
	onValueChange: (value: number | null) => void;
};

/**
 * Input numérico que se formatea a pesos colombianos (`$ 1.234.567`) a medida que el usuario
 * escribe. El valor real que expone (`number | null`) son siempre los dígitos sin formato; el
 * signo de pesos y los puntos de miles son solo de presentación.
 *
 * Ejemplo:
 * ```tsx
 * const [amount, setAmount] = useState<number | null>(null);
 * <CurrencyInput value={amount} onValueChange={setAmount} />
 * ```
 */
export function CurrencyInput({
	value,
	onValueChange,
	...props
}: CurrencyInputProps) {
	return (
		<Input
			type="text"
			inputMode="numeric"
			value={value === null ? "" : formatCurrency(value)}
			onChange={(event) => {
				const digitsOnly = event.target.value.replace(/\D/g, "");
				onValueChange(digitsOnly === "" ? null : Number(digitsOnly));
			}}
			{...props}
		/>
	);
}
