import { format, subMonths } from "date-fns";
import type { ProfitPayout } from "@/types";

function toDateOnly(date: Date): string {
	return format(date, "yyyy-MM-dd");
}

/** Semilla de pagos de ganancias a grupos de ejemplo, repartida en el mes anterior. */
export function buildProfitPayoutsMock(userId: string): ProfitPayout[] {
	const now = new Date();
	const iso = now.toISOString();

	const rows: Omit<
		ProfitPayout,
		"id" | "createdBy" | "createdAt" | "updatedAt"
	>[] = [
		{
			date: toDateOnly(subMonths(now, 1)),
			amount: 1_500_000,
			groupId: "inv-group-a",
			note: `Ganancias del mes de ${format(subMonths(now, 1), "MM/yyyy")}`,
			status: "activo",
		},
	];

	return rows.map((row, index) => ({
		...row,
		id: `payout-${index + 1}`,
		createdBy: userId,
		createdAt: iso,
		updatedAt: iso,
	}));
}
