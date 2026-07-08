"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";
import type { RevenuePoint } from "@/types";

const chartConfig: ChartConfig = {
	income: { label: "Ingreso", color: "var(--chart-1)" },
};

function formatDayLabel(dateIso: string): string {
	const [, month, day] = dateIso.split("-");
	return `${day}/${month}`;
}

/** Área de ingreso esperado por día — una sola serie, color sequential (`--chart-1`). */
export function RevenueTrendChart({ data }: { data: RevenuePoint[] }) {
	return (
		<ChartContainer config={chartConfig} className="aspect-auto h-64">
			<AreaChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
				<defs>
					<linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
						<stop
							offset="0%"
							stopColor={chartConfig.income.color}
							stopOpacity={0.35}
						/>
						<stop
							offset="100%"
							stopColor={chartConfig.income.color}
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
					dataKey="income"
					type="monotone"
					stroke={chartConfig.income.color}
					fill="url(#revenueFill)"
					strokeWidth={2}
				/>
			</AreaChart>
		</ChartContainer>
	);
}
