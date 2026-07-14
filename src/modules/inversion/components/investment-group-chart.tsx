"use client";

import { formatCurrency } from "@/lib/format";
import { RankedBarChart } from "@/modules/inicio/components/ranked-bar-chart";

interface InvestmentGroupChartProps {
	data: { id: string; label: string; value: number }[];
}

/** Inversión por grupo del mes — una sola magnitud, mismo componente que "Producto más vendido". */
export function InvestmentGroupChart({ data }: InvestmentGroupChartProps) {
	return (
		<RankedBarChart
			data={data}
			valueLabel="Invertido"
			valueFormatter={formatCurrency}
		/>
	);
}
