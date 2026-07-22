"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/**
 * Interruptor para incluir/excluir los gastos operativos del período (`gastos` module) al calcular
 * la ganancia neta de Proyección. Estado en la URL (`?gastos=0` para excluir), no en cliente, para
 * mantenerse consistente con `ProfitPeriodSelector` — el resto de los parámetros de búsqueda
 * (período, rango) se conserva al alternar.
 */
export function IncludeExpensesToggle({ checked }: { checked: boolean }) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const handleCheckedChange = (next: boolean) => {
		const params = new URLSearchParams(searchParams.toString());
		if (next) params.delete("gastos");
		else params.set("gastos", "0");
		router.push(`${pathname}?${params.toString()}`);
	};

	return (
		<div className="flex items-center gap-2 rounded-lg border px-3 py-2">
			<Switch
				id="include-expenses"
				checked={checked}
				onCheckedChange={handleCheckedChange}
			/>
			<Label htmlFor="include-expenses" className="text-sm">
				Incluir gastos en la ganancia neta
			</Label>
		</div>
	);
}
