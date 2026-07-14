import { format, subDays, subMonths } from "date-fns";
import type { Expense } from "@/types";

function toDateOnly(date: Date): string {
	return format(date, "yyyy-MM-dd");
}

/** Semilla de gastos de ejemplo, repartidos en el mes actual y el anterior. */
export function buildExpensesMock(userId: string): Expense[] {
	const now = new Date();
	const iso = now.toISOString();

	const rows: Omit<Expense, "id" | "createdBy" | "createdAt" | "updatedAt">[] =
		[
			{
				date: toDateOnly(subDays(now, 2)),
				amount: 1_800_000,
				categoryId: "exp-cat-arriendo",
				description: "Arriendo del local",
				supplier: "Claudia Restrepo",
				paymentMethod: "Transferencia",
				invoiceRef: "REC-2026-014",
				status: "pagado",
				type: "fijo",
			},
			{
				date: toDateOnly(subDays(now, 5)),
				amount: 420_000,
				categoryId: "exp-cat-servicios",
				description: "Energía y acueducto",
				supplier: "Empresa de servicios públicos",
				paymentMethod: "Transferencia",
				invoiceRef: "FAC-88213",
				status: "pagado",
				type: "recurrente",
			},
			{
				date: toDateOnly(subDays(now, 1)),
				amount: 250_000,
				categoryId: "exp-cat-publicidad-redes",
				description: "Pauta en redes sociales",
				supplier: "Meta Ads",
				paymentMethod: "Tarjeta",
				status: "pagado",
				type: "variable",
			},
			{
				date: toDateOnly(subDays(now, 8)),
				amount: 180_000,
				categoryId: "exp-cat-mantenimiento",
				description: "Mantenimiento de neveras",
				supplier: "Servitec Refrigeración",
				paymentMethod: "Efectivo",
				status: "pendiente",
				type: "variable",
			},
			{
				date: toDateOnly(subMonths(now, 1)),
				amount: 1_800_000,
				categoryId: "exp-cat-arriendo",
				description: "Arriendo del local",
				supplier: "Claudia Restrepo",
				paymentMethod: "Transferencia",
				invoiceRef: "REC-2026-013",
				status: "pagado",
				type: "fijo",
			},
			{
				date: toDateOnly(subMonths(now, 1)),
				amount: 300_000,
				categoryId: "exp-cat-transporte",
				description: "Domicilios de mercancía",
				paymentMethod: "Efectivo",
				status: "pagado",
				type: "variable",
			},
		];

	return rows.map((row, index) => ({
		...row,
		id: `exp-${index + 1}`,
		createdBy: userId,
		createdAt: iso,
		updatedAt: iso,
	}));
}
