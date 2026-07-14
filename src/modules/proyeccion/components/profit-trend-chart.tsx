"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import type { ProfitPoint } from "@/data/repositories/proyeccion-dashboard-repository";
import { formatCurrency } from "@/lib/format";

const chartConfig: ChartConfig = {
	profit: { label: "Ganancia real", color: "var(--chart-1)" },
};

function formatDayLabel(dateIso: string): string {
	const [, month, day] = dateIso.split("-");
	return `${day}/${month}`;
}

/** Área de ganancia real por día dentro del período seleccionado — una sola serie, color
 * secuencial (`--chart-1`), mismo componente que `RevenueTrendChart` en Inicio. */
export function ProfitTrendChart({ data }: { data: ProfitPoint[] }) {
	return (
		<ChartContainer config={chartConfig} className="aspect-auto h-64">
			<AreaChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
				<defs>
					<linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
						<stop
							offset="0%"
							stopColor={chartConfig.profit.color}
							stopOpacity={0.35}
						/>
						<stop
							offset="100%"
							stopColor={chartConfig.profit.color}
							stopOpacity={0.03}
						/>
					</linearGradient>
				</defs>
				<CartesianGrid vertical={false} strokeDasharray="3 3" />
				<XAxis
					dataKey="date"
					tickFormatter={formatDayLabel}
					tickLine={false}
					axisLine={false}
					minTickGap={24}
				/>
				<ChartTooltip
					content={<ChartTooltipContent formatter={formatCurrency} />}
					labelFormatter={(value) => formatDayLabel(String(value))}
				/>
				<Area
					dataKey="profit"
					type="monotone"
					stroke={chartConfig.profit.color}
					fill="url(#profitFill)"
					strokeWidth={2}
				/>
			</AreaChart>
		</ChartContainer>
	);
}
