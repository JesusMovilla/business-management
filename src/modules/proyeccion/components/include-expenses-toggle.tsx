"use client";

import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/**
 * Interruptor para incluir/excluir los gastos operativos del período (`gastos` module) al calcular
 * la ganancia neta de Proyección. Estado en la URL (`?gastos=0` para excluir), no en cliente, para
 * mantenerse consistente con `ProfitPeriodSelector` — el resto de los parámetros de búsqueda
 * (período, rango) se conserva al alternar. Lee `pathname`/`searchParams` directo de
 * `window.location` dentro del handler en vez de `usePathname`/`useSearchParams` — solo se usan al
 * hacer click, suscribirse a esos hooks solo fuerza un re-render en cada cambio de URL sin motivo.
 */
export function IncludeExpensesToggle({ checked }: { checked: boolean }) {
	const router = useRouter();

	const handleCheckedChange = (next: boolean) => {
		const params = new URLSearchParams(window.location.search);
		if (next) params.delete("gastos");
		else params.set("gastos", "0");
		router.push(`${window.location.pathname}?${params.toString()}`);
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
