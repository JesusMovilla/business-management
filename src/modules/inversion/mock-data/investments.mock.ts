import { format, subDays, subMonths } from "date-fns";
import type { Investment } from "@/types";

function toDateOnly(date: Date): string {
	return format(date, "yyyy-MM-dd");
}

/** Semilla de inversiones de ejemplo, repartidas en el mes actual y el anterior. */
export function buildInvestmentsMock(userId: string): Investment[] {
	const now = new Date();
	const iso = now.toISOString();

	const rows: Omit<
		Investment,
		"id" | "createdBy" | "createdAt" | "updatedAt"
	>[] = [
		{
			date: toDateOnly(subDays(now, 3)),
			amount: 5_000_000,
			groupId: "inv-group-a",
			description: "Aporte de capital para reposición de inventario",
			status: "activa",
		},
		{
			date: toDateOnly(subMonths(now, 1)),
			amount: 2_000_000,
			groupId: "inv-group-a",
			description: "Aporte de capital de trabajo",
			status: "activa",
		},
	];

	return rows.map((row, index) => ({
		...row,
		id: `inv-${index + 1}`,
		createdBy: userId,
		createdAt: iso,
		updatedAt: iso,
	}));
}
