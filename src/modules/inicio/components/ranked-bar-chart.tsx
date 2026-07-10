"use client";

import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

export interface RankedBarDatum {
	id: string;
	label: string;
	value: number;
	href?: string;
}

interface RankedBarChartProps {
	data: RankedBarDatum[];
	valueLabel: string;
	valueFormatter?: (value: number) => string;
}

/**
 * Barras horizontales de una sola magnitud, ordenadas de mayor a menor — usado por "Producto más
 * vendido". Una sola serie no necesita color categórico (ver skill de dataviz: comparar magnitud =
 * un solo hue). Si `data[].href` viene definido, un click en la barra navega ahí (ej. al detalle
 * del producto).
 */
export function RankedBarChart({
	data,
	valueLabel,
	valueFormatter,
}: RankedBarChartProps) {
	const router = useRouter();

	if (data.length === 0) {
		return (
			<p className="py-8 text-center text-muted-foreground text-sm">
				No hay datos suficientes todavía.
			</p>
		);
	}

	const config: ChartConfig = {
		value: { label: valueLabel, color: "var(--chart-1)" },
	};
	const hasLinks = data.some((datum) => datum.href);

	return (
		<ChartContainer config={config} className="aspect-auto h-64">
			<BarChart data={data} layout="vertical" margin={{ left: 8, right: 12 }}>
				<CartesianGrid horizontal={false} strokeDasharray="3 3" />
				<XAxis type="number" tickLine={false} axisLine={false} />
				<YAxis
					type="category"
					dataKey="label"
					tickLine={false}
					axisLine={false}
					width={140}
					tick={{ fontSize: 12 }}
				/>
				<ChartTooltip
					content={<ChartTooltipContent formatter={valueFormatter} />}
				/>
				<Bar
					dataKey="value"
					fill={config.value.color}
					radius={4}
					className={hasLinks ? "cursor-pointer" : undefined}
					onClick={(entry) => {
						const href = (entry?.payload as RankedBarDatum | undefined)?.href;
						if (href) router.push(href);
					}}
				/>
			</BarChart>
		</ChartContainer>
	);
}
