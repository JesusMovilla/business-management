"use client";

import { formatCurrency } from "@/lib/format";
import { RankedBarChart } from "@/modules/inicio/components/ranked-bar-chart";

interface ExpenseCategoryChartProps {
	data: { id: string; label: string; value: number }[];
}

/** Gasto por categoría del mes — una sola magnitud, mismo componente que "Producto más vendido". */
export function ExpenseCategoryChart({ data }: ExpenseCategoryChartProps) {
	return (
		<RankedBarChart
			data={data}
			valueLabel="Gasto"
			valueFormatter={formatCurrency}
		/>
	);
}
