export interface CalendarDayCell {
	iso: string;
	dayNumber: number;
	inMonth: boolean;
}

function toIso(year: number, month: number, day: number): string {
	return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function todayIso(): string {
	const now = new Date();
	return toIso(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Arma la grilla semanal (domingo a sábado) de un mes, con relleno de días del mes anterior/siguiente. */
export function buildMonthGrid(
	year: number,
	month: number,
): CalendarDayCell[][] {
	const firstWeekday = new Date(year, month, 1).getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const daysInPrevMonth = new Date(year, month, 0).getDate();

	const cells: CalendarDayCell[] = [];

	for (let i = 0; i < firstWeekday; i++) {
		cells.push({
			iso: "",
			dayNumber: daysInPrevMonth - firstWeekday + 1 + i,
			inMonth: false,
		});
	}
	for (let day = 1; day <= daysInMonth; day++) {
		cells.push({ iso: toIso(year, month, day), dayNumber: day, inMonth: true });
	}
	const remainder = (7 - (cells.length % 7)) % 7;
	for (let i = 0; i < remainder; i++) {
		cells.push({ iso: "", dayNumber: i + 1, inMonth: false });
	}

	const weeks: CalendarDayCell[][] = [];
	for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
	return weeks;
}

const MONTH_NAMES = [
	"Enero",
	"Febrero",
	"Marzo",
	"Abril",
	"Mayo",
	"Junio",
	"Julio",
	"Agosto",
	"Septiembre",
	"Octubre",
	"Noviembre",
	"Diciembre",
];

export function monthLabel(year: number, month: number): string {
	return `${MONTH_NAMES[month]} ${year}`;
}

export function formatDayLabel(iso: string): string {
	const [year, month, day] = iso.split("-").map(Number);
	return new Date(year, month - 1, day).toLocaleDateString("es-CO", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

export function formatShortDayLabel(iso: string): string {
	const [year, month, day] = iso.split("-").map(Number);
	return new Date(year, month - 1, day).toLocaleDateString("es-CO", {
		weekday: "short",
		day: "numeric",
		month: "short",
	});
}
