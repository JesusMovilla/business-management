import { format, startOfMonth, startOfWeek } from "date-fns";

export const PERIOD_KEYS = ["hoy", "semana", "mes", "anio", "custom"] as const;
export type PeriodKey = (typeof PERIOD_KEYS)[number];

export const PERIOD_LABELS: Record<PeriodKey, string> = {
	hoy: "Hoy",
	semana: "Esta semana",
	mes: "Este mes",
	anio: "Este año",
	custom: "Personalizado",
};

export interface DateRange {
	/** "YYYY-MM-DD" */
	from: string;
	/** "YYYY-MM-DD" */
	to: string;
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function toDateOnly(date: Date): string {
	return format(date, "yyyy-MM-dd");
}

function isDateOnly(value: string | undefined): value is string {
	return !!value && DATE_ONLY_RE.test(value);
}

/**
 * Resuelve el período elegido (`?period=`) a un rango de fechas concreto. "hoy"/"semana"/"mes"/
 * "año" van desde el inicio del período hasta hoy (progreso a la fecha, no el período completo);
 * "custom" usa `?from=`/`?to=` si son fechas válidas, con `mes` como respaldo.
 */
export function resolvePeriod(searchParams: {
	period?: string;
	from?: string;
	to?: string;
}): { period: PeriodKey; range: DateRange } {
	const period: PeriodKey = (PERIOD_KEYS as readonly string[]).includes(
		searchParams.period ?? "",
	)
		? (searchParams.period as PeriodKey)
		: "mes";

	const now = new Date();
	const today = toDateOnly(now);

	if (period === "hoy") return { period, range: { from: today, to: today } };
	if (period === "semana") {
		return {
			period,
			range: {
				from: toDateOnly(startOfWeek(now, { weekStartsOn: 1 })),
				to: today,
			},
		};
	}
	if (period === "mes") {
		return {
			period,
			range: { from: toDateOnly(startOfMonth(now)), to: today },
		};
	}
	if (period === "anio") {
		return { period, range: { from: `${now.getFullYear()}-01-01`, to: today } };
	}

	const from = isDateOnly(searchParams.from)
		? searchParams.from
		: toDateOnly(startOfMonth(now));
	const to = isDateOnly(searchParams.to) ? searchParams.to : today;
	return {
		period: "custom",
		range: from <= to ? { from, to } : { from: to, to: from },
	};
}

/**
 * Resuelve si los gastos operativos deben restarse de la ganancia neta (`?gastos=0` los excluye).
 * Habilitado por defecto — ausencia del parámetro o cualquier valor distinto de "0" cuenta como sí.
 */
export function resolveIncludeExpenses(searchParams: {
	gastos?: string;
}): boolean {
	return searchParams.gastos !== "0";
}

/** Etiqueta corta para mostrar junto a los KPIs que dependen del período seleccionado. */
export function formatPeriodLabel(period: PeriodKey, range: DateRange): string {
	if (period !== "custom") return PERIOD_LABELS[period].toLowerCase();
	const [fy, fm, fd] = range.from.split("-");
	const [ty, tm, td] = range.to.split("-");
	return `${fd}/${fm}/${fy.slice(2)} – ${td}/${tm}/${ty.slice(2)}`;
}
