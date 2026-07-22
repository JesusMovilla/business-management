"use client";

import type { DotProps } from "recharts";
import {
	CartesianGrid,
	ComposedChart,
	Line,
	ReferenceLine,
	XAxis,
} from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import type { ProfitPoint } from "@/data/repositories/proyeccion-dashboard-repository";
import { formatCurrency } from "@/lib/format";

const chartConfig: ChartConfig = {
	gain: { label: "Ganancia", color: "var(--chart-2)" },
	loss: { label: "Pérdida", color: "var(--destructive)" },
	// La serie de datos se llama `profit` (ver `ProfitPoint`) — esta entrada es la que usa
	// `ChartTooltipContent` para traducir esa key al pasar el cursor sobre un punto.
	profit: { label: "Ganancia neta", color: "var(--chart-2)" },
};

function formatDayLabel(dateIso: string): string {
	const [, month, day] = dateIso.split("-");
	return `${day}/${month}`;
}

/** Punto donde la línea cruza 0, para partir el gradiente del trazo/relleno exactamente en la
 * frontera ganancia/pérdida (técnica estándar de Recharts para líneas de dos colores). */
function zeroCrossingOffset(data: ProfitPoint[]): number {
	const values = data.map((point) => point.profit);
	const max = Math.max(...values, 0);
	const min = Math.min(...values, 0);
	if (max <= 0) return 0;
	if (min >= 0) return 1;
	return max / (max - min);
}

function ProfitDot({ cx, cy, payload }: DotProps & { payload?: ProfitPoint }) {
	if (cx === undefined || cy === undefined || !payload) return null;
	const color =
		payload.profit >= 0 ? chartConfig.gain.color : chartConfig.loss.color;
	return (
		<circle
			cx={cx}
			cy={cy}
			r={4}
			fill={color}
			stroke="var(--background)"
			strokeWidth={2}
		/>
	);
}

/**
 * Línea de ganancia neta por día dentro del período seleccionado — sube y baja con la ganancia de
 * cada día, cruzando una línea base en 0. El trazo se parte en la frontera 0 (verde arriba, rojo
 * abajo, ver `chartConfig`) para que un día en pérdida sea visible de un vistazo, y cada punto
 * lleva el mismo color según su signo. `data.profit` ya viene neto de gastos si el toggle
 * "Incluir gastos" está activo (ver `proyeccionDashboardRepository.getProfitTrend`).
 */
export function ProfitTrendChart({ data }: { data: ProfitPoint[] }) {
	const offset = zeroCrossingOffset(data);

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-4 text-muted-foreground text-xs">
				<span className="flex items-center gap-1.5">
					<span
						className="size-2 rounded-full"
						style={{ backgroundColor: chartConfig.gain.color }}
					/>
					{chartConfig.gain.label}
				</span>
				<span className="flex items-center gap-1.5">
					<span
						className="size-2 rounded-full"
						style={{ backgroundColor: chartConfig.loss.color }}
					/>
					{chartConfig.loss.label}
				</span>
			</div>
			<ChartContainer config={chartConfig} className="aspect-auto h-64">
				<ComposedChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
					<defs>
						<linearGradient id="profitSplit" x1="0" y1="0" x2="0" y2="1">
							<stop offset={0} stopColor={chartConfig.gain.color} />
							<stop offset={offset} stopColor={chartConfig.gain.color} />
							<stop offset={offset} stopColor={chartConfig.loss.color} />
							<stop offset={1} stopColor={chartConfig.loss.color} />
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
					<ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
					<ChartTooltip
						content={<ChartTooltipContent formatter={formatCurrency} />}
						labelFormatter={(value) => formatDayLabel(String(value))}
					/>
					<Line
						dataKey="profit"
						type="monotone"
						stroke="url(#profitSplit)"
						strokeWidth={2}
						dot={<ProfitDot />}
						activeDot={{ r: 5, stroke: "var(--background)", strokeWidth: 2 }}
					/>
				</ComposedChart>
			</ChartContainer>
		</div>
	);
}
