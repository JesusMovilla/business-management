"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvestmentGroupChart } from "./investment-group-chart";

interface InvestmentGroupChartCardProps {
	monthData: { id: string; label: string; value: number }[];
	allTimeData: { id: string; label: string; value: number }[];
}

/**
 * Card de "Inversión por grupo" con selector Mes actual / Histórico. Ambos datasets se calculan
 * en el servidor y se pasan ya listos — el toggle solo cambia cuál se muestra, sin refetch.
 */
export function InvestmentGroupChartCard({
	monthData,
	allTimeData,
}: InvestmentGroupChartCardProps) {
	const [scope, setScope] = useState<"month" | "all">("month");

	return (
		<Card>
			<CardHeader className="flex flex-wrap items-center justify-between gap-2">
				<CardTitle>Inversión por grupo</CardTitle>
				<div className="flex gap-1">
					<Button
						type="button"
						size="sm"
						variant={scope === "month" ? "default" : "outline"}
						onClick={() => setScope("month")}
					>
						Mes actual
					</Button>
					<Button
						type="button"
						size="sm"
						variant={scope === "all" ? "default" : "outline"}
						onClick={() => setScope("all")}
					>
						Histórico
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<InvestmentGroupChart
					data={scope === "month" ? monthData : allTimeData}
				/>
			</CardContent>
		</Card>
	);
}
