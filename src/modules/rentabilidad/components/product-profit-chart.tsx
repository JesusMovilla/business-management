"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	Tooltip as RechartsTooltip,
	XAxis,
	YAxis,
} from "recharts";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";

export interface ProductProfitDatum {
	id: string;
	label: string;
	ganancia: number;
	unidades: number;
}

const chartConfig: ChartConfig = {
	ganancia: { label: "Ganancia", color: "var(--chart-1)" },
};

interface TooltipPayloadItem {
	payload: ProductProfitDatum;
}

/** Tooltip a medida (no `ChartTooltipContent`, que solo muestra una magnitud por serie): cada
 * producto necesita mostrar unidades vendidas y ganancia bruta a la vez. */
function ProductProfitTooltip({
	active,
	payload,
}: {
	active?: boolean;
	payload?: readonly TooltipPayloadItem[];
}) {
	if (!active || !payload?.length) return null;
	const datum = payload[0].payload;
	return (
		<div className="grid min-w-40 gap-1 rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground text-xs shadow-md">
			<span className="font-medium">{datum.label}</span>
			<div className="flex items-center justify-between gap-3">
				<span className="text-muted-foreground">Ganancia</span>
				<span className="font-medium tabular-nums">
					{formatCurrency(datum.ganancia)}
				</span>
			</div>
			<div className="flex items-center justify-between gap-3">
				<span className="text-muted-foreground">Unidades vendidas</span>
				<span className="font-medium tabular-nums">{datum.unidades}</span>
			</div>
		</div>
	);
}

/** Top productos por ganancia real, con unidades vendidas visibles en el tooltip — a diferencia de
 * `RankedBarChart` (una sola magnitud), aquí se necesitan ambas para juzgar si la ganancia viene de
 * pocas unidades con buen margen o de mucho volumen. */
export function ProductProfitChart({ data }: { data: ProductProfitDatum[] }) {
	if (data.length === 0) {
		return (
			<p className="py-8 text-center text-muted-foreground text-sm">
				No hay ventas registradas en este período.
			</p>
		);
	}

	return (
		<ChartContainer config={chartConfig} className="aspect-auto h-64">
			<BarChart data={data} layout="vertical" margin={{ left: 8, right: 12 }}>
				<CartesianGrid horizontal={false} strokeDasharray="3 3" />
				<XAxis
					type="number"
					tickLine={false}
					axisLine={false}
					tickFormatter={formatCurrency}
				/>
				<YAxis
					type="category"
					dataKey="label"
					tickLine={false}
					axisLine={false}
					width={140}
					tick={{ fontSize: 12 }}
				/>
				<RechartsTooltip content={<ProductProfitTooltip />} />
				<Bar dataKey="ganancia" fill={chartConfig.ganancia.color} radius={4} />
			</BarChart>
		</ChartContainer>
	);
}
