"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import type { ExpenseMonthlyTotal } from "@/data/repositories/expense-dashboard-repository";
import { formatCurrency } from "@/lib/format";

const chartConfig: ChartConfig = {
	total: { label: "Gasto", color: "var(--chart-2)" },
};

function formatMonthLabel(month: string): string {
	const [year, monthNumber] = month.split("-");
	return `${monthNumber}/${year.slice(2)}`;
}

/** Evolución del gasto total mes a mes — una sola serie, color secuencial (`--chart-2`). */
export function ExpenseMonthlyTrendChart({
	data,
}: {
	data: ExpenseMonthlyTotal[];
}) {
	return (
		<ChartContainer config={chartConfig} className="aspect-auto h-64">
			<BarChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
				<CartesianGrid vertical={false} strokeDasharray="3 3" />
				<XAxis
					dataKey="month"
					tickFormatter={formatMonthLabel}
					tickLine={false}
					axisLine={false}
				/>
				<ChartTooltip
					content={<ChartTooltipContent formatter={formatCurrency} />}
					labelFormatter={(value) => formatMonthLabel(String(value))}
				/>
				<Bar dataKey="total" fill={chartConfig.total.color} radius={4} />
			</BarChart>
		</ChartContainer>
	);
}
