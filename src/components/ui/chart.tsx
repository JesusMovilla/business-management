"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

export interface ChartConfig {
	[key: string]: {
		label: string;
		color: string;
	};
}

const ChartContext = React.createContext<ChartConfig | null>(null);

function useChartConfig(): ChartConfig {
	const context = React.useContext(ChartContext);
	if (!context) {
		throw new Error("useChartConfig debe usarse dentro de <ChartContainer>");
	}
	return context;
}

interface ChartContainerProps extends React.ComponentProps<"div"> {
	config: ChartConfig;
	children: React.ComponentProps<
		typeof RechartsPrimitive.ResponsiveContainer
	>["children"];
}

/**
 * Envoltorio de Recharts con los tokens semánticos del proyecto (grid/ejes) y tooltip/legend ya
 * estilizados para modo claro/oscuro. `config` mapea cada serie a su `label` y `color` — usar los
 * tokens `var(--chart-1)`..`var(--chart-5)` (paleta validada, ver skill de dataviz) en vez de
 * colores sueltos.
 *
 * Ejemplo:
 * ```tsx
 * const config = { income: { label: "Ingreso", color: "var(--chart-1)" } };
 * <ChartContainer config={config} className="h-64">
 *   <AreaChart data={data}>
 *     <Area dataKey="income" stroke={config.income.color} fill={config.income.color} />
 *     <ChartTooltip content={<ChartTooltipContent />} />
 *   </AreaChart>
 * </ChartContainer>
 * ```
 */
function ChartContainer({
	config,
	className,
	children,
	...props
}: ChartContainerProps) {
	return (
		<ChartContext.Provider value={config}>
			<div
				data-slot="chart"
				className={cn(
					"aspect-video w-full text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border [&_.recharts-reference-line_line]:stroke-border",
					className,
				)}
				{...props}
			>
				<RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
					{children}
				</RechartsPrimitive.ResponsiveContainer>
			</div>
		</ChartContext.Provider>
	);
}

const ChartTooltip = RechartsPrimitive.Tooltip;

interface ChartTooltipPayloadItem {
	dataKey?: string | number;
	name?: string | number;
	value?: number | string;
	color?: string;
}

interface ChartTooltipContentProps {
	active?: boolean;
	payload?: readonly ChartTooltipPayloadItem[];
	label?: React.ReactNode;
	formatter?: (value: number) => string;
}

function ChartTooltipContent({
	active,
	payload,
	label,
	formatter,
}: ChartTooltipContentProps) {
	const config = useChartConfig();
	if (!active || !payload?.length) return null;

	return (
		<div className="grid min-w-32 gap-1.5 rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground text-xs shadow-md">
			{label !== undefined && <span className="font-medium">{label}</span>}
			{payload.map((item) => {
				const key = item.dataKey
					? String(item.dataKey)
					: item.name
						? String(item.name)
						: "";
				const itemConfig = config[key];
				const value =
					typeof item.value === "number" ? item.value : Number(item.value ?? 0);
				return (
					<div key={key} className="flex items-center gap-2">
						<span
							className="size-2 shrink-0 rounded-[2px]"
							style={{ background: itemConfig?.color ?? item.color }}
						/>
						<span className="text-muted-foreground">
							{itemConfig?.label ?? key}
						</span>
						<span className="ml-auto font-medium tabular-nums">
							{formatter ? formatter(value) : value}
						</span>
					</div>
				);
			})}
		</div>
	);
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
	payload,
}: RechartsPrimitive.DefaultLegendContentProps) {
	const config = useChartConfig();
	if (!payload?.length) return null;

	return (
		<div className="flex flex-wrap items-center justify-center gap-4 pt-3">
			{payload.map((item) => {
				const key = item.dataKey ? String(item.dataKey) : String(item.value);
				const itemConfig = config[key];
				return (
					<div key={key} className="flex items-center gap-1.5">
						<span
							className="size-2 shrink-0 rounded-[2px]"
							style={{ background: itemConfig?.color ?? item.color }}
						/>
						<span className="text-muted-foreground text-xs">
							{itemConfig?.label ?? key}
						</span>
					</div>
				);
			})}
		</div>
	);
}

export {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	useChartConfig,
};
