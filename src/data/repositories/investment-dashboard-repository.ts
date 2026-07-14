import { format, startOfMonth, subMonths } from "date-fns";
import { investmentGroupRepository } from "@/data/repositories/investment-group-repository";
import { investmentRepository } from "@/data/repositories/investment-repository";
import type { Investment } from "@/types";

function toDateOnly(date: Date): string {
	return format(date, "yyyy-MM-dd");
}

function sum(rows: Investment[]): number {
	return rows.reduce((total, row) => total + row.amount, 0);
}

export interface InvestmentKpis {
	totalToday: number;
	totalThisMonth: number;
	totalThisYear: number;
	previousMonthTotal: number;
	comparisonVsLastMonthPercent: number | null;
	topGroupName: string | null;
}

export interface InvestmentGroupTotal {
	groupId: string;
	name: string;
	total: number;
}

export interface InvestmentMonthlyTotal {
	month: string;
	total: number;
}

/**
 * Agregaciones de Inversión para el dashboard, mismo criterio que
 * `expense-dashboard-repository.ts`: el volumen de datos de un solo negocio no justifica más que
 * traer las inversiones y reducir en JS.
 */
export const investmentDashboardRepository = {
	async getKpis(): Promise<InvestmentKpis> {
		const now = new Date();
		const today = toDateOnly(now);
		const monthStart = toDateOnly(startOfMonth(now));
		const previousMonthStart = toDateOnly(startOfMonth(subMonths(now, 1)));
		const yearStart = `${now.getFullYear()}-01-01`;

		const [allInvestments, groups] = await Promise.all([
			investmentRepository.list(),
			investmentGroupRepository.list(),
		]);

		const active = allInvestments.filter(
			(investment) => investment.status !== "anulada",
		);

		const totalToday = sum(active.filter((i) => i.date === today));
		const totalThisMonth = sum(active.filter((i) => i.date >= monthStart));
		const totalThisYear = sum(active.filter((i) => i.date >= yearStart));
		const previousMonthTotal = sum(
			active.filter((i) => i.date >= previousMonthStart && i.date < monthStart),
		);
		const comparisonVsLastMonthPercent =
			previousMonthTotal > 0
				? ((totalThisMonth - previousMonthTotal) / previousMonthTotal) * 100
				: null;

		const groupNameById = new Map(groups.map((g) => [g.id, g.name]));
		const totalsByGroup = new Map<string, number>();
		for (const investment of active.filter((i) => i.date >= monthStart)) {
			totalsByGroup.set(
				investment.groupId,
				(totalsByGroup.get(investment.groupId) ?? 0) + investment.amount,
			);
		}
		const topGroupEntry = [...totalsByGroup.entries()].sort(
			(a, b) => b[1] - a[1],
		)[0];

		return {
			totalToday,
			totalThisMonth,
			totalThisYear,
			previousMonthTotal,
			comparisonVsLastMonthPercent,
			topGroupName: topGroupEntry
				? (groupNameById.get(topGroupEntry[0]) ?? null)
				: null,
		};
	},

	/** Inversión por grupo del mes actual, de mayor a menor. */
	async getGroupBreakdown(): Promise<InvestmentGroupTotal[]> {
		const monthStart = toDateOnly(startOfMonth(new Date()));
		const [allInvestments, groups] = await Promise.all([
			investmentRepository.list(),
			investmentGroupRepository.list(),
		]);
		const groupNameById = new Map(groups.map((g) => [g.id, g.name]));
		const totals = new Map<string, number>();
		for (const investment of allInvestments) {
			if (investment.status === "anulada" || investment.date < monthStart)
				continue;
			totals.set(
				investment.groupId,
				(totals.get(investment.groupId) ?? 0) + investment.amount,
			);
		}
		return [...totals.entries()]
			.map(([groupId, total]) => ({
				groupId,
				name: groupNameById.get(groupId) ?? "Sin grupo",
				total,
			}))
			.sort((a, b) => b.total - a.total);
	},

	/** Inversión total mes a mes, últimos `months` meses (incluido el actual). */
	async getMonthlyTrend(months = 6): Promise<InvestmentMonthlyTotal[]> {
		const allInvestments = await investmentRepository.list();
		const active = allInvestments.filter((i) => i.status !== "anulada");
		const result: InvestmentMonthlyTotal[] = [];
		for (let i = months - 1; i >= 0; i--) {
			const monthKey = format(subMonths(new Date(), i), "yyyy-MM");
			const total = sum(active.filter((row) => row.date.startsWith(monthKey)));
			result.push({ month: monthKey, total });
		}
		return result;
	},
};
