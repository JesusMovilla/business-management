"use client";

import { Bar, CartesianGrid, ComposedChart, Line, XAxis } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";

export interface CombinedTrendPoint {
	date: string;
	ventas: number;
	gananciaBruta: number;
	gastos: number;
}

const chartConfig: ChartConfig = {
	ventas: { label: "Ventas", color: "var(--chart-1)" },
	gananciaBruta: { label: "Ganancia bruta", color: "var(--chart-2)" },
	gastos: { label: "Gastos", color: "var(--destructive)" },
};

function formatDayLabel(dateIso: string): string {
	const [, month, day] = dateIso.split("-");
	return `${day}/${month}`;
}

/** Ventas (barras) + ganancia bruta y gastos (líneas) por día, en el período seleccionado — la
 * gráfica principal del resumen ejecutivo, para ver de un vistazo si la ganancia crece al mismo
 * ritmo que la venta o si los gastos se la están comiendo. */
export function CombinedTrendChart({ data }: { data: CombinedTrendPoint[] }) {
	if (data.length === 0) {
		return (
			<p className="py-8 text-center text-muted-foreground text-sm">
				No hay ventas ni gastos registrados en este período.
			</p>
		);
	}

	return (
		<ChartContainer config={chartConfig} className="aspect-auto h-72">
			<ComposedChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
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
				<ChartLegend content={<ChartLegendContent />} />
				<Bar
					dataKey="ventas"
					fill={chartConfig.ventas.color}
					radius={[4, 4, 0, 0]}
				/>
				<Line
					dataKey="gananciaBruta"
					type="monotone"
					stroke={chartConfig.gananciaBruta.color}
					strokeWidth={2}
					dot={false}
				/>
				<Line
					dataKey="gastos"
					type="monotone"
					stroke={chartConfig.gastos.color}
					strokeWidth={2}
					strokeDasharray="4 4"
					dot={false}
				/>
			</ComposedChart>
		</ChartContainer>
	);
}
