"use client";

import { formatCurrency } from "@/lib/format";
import { RankedBarChart } from "@/modules/inicio/components/ranked-bar-chart";

interface CategoryProfitChartProps {
	data: { id: string; label: string; value: number }[];
}

/**
 * Ganancia por categoría, ordenada por ganancia (no por venta). Envuelve `RankedBarChart` en un
 * componente cliente propio porque `valueFormatter` es una función — no se puede pasar como prop
 * desde un Server Component (`page.tsx`) directo a un Client Component; acá se define y usa dentro
 * del mismo archivo cliente, mismo patrón que `ProfitByProductChart` en el módulo Proyección.
 */
export function CategoryProfitChart({ data }: CategoryProfitChartProps) {
	return (
		<RankedBarChart
			data={data}
			valueLabel="Ganancia"
			valueFormatter={formatCurrency}
		/>
	);
}
