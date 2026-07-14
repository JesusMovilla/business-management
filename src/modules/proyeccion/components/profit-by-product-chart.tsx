"use client";

import { formatCurrency } from "@/lib/format";
import { RankedBarChart } from "@/modules/inicio/components/ranked-bar-chart";

interface ProfitByProductChartProps {
	data: { id: string; label: string; value: number }[];
}

/** Top productos por ganancia real (últimos 30 días) — una sola magnitud, mismo componente que
 * "Producto más vendido" en Inicio. */
export function ProfitByProductChart({ data }: ProfitByProductChartProps) {
	return (
		<RankedBarChart
			data={data}
			valueLabel="Ganancia"
			valueFormatter={formatCurrency}
		/>
	);
}
