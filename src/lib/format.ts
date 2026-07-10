const currencyFormatter = new Intl.NumberFormat("es-CO", {
	style: "currency",
	currency: "COP",
	maximumFractionDigits: 0,
});

export function formatCurrency(value: number): string {
	return currencyFormatter.format(value);
}

export function formatPercent(value: number): string {
	return `${value.toFixed(1)}%`;
}

/**
 * `hour12: false` evita el token a. m./p. m., cuyo espacio especial (U+202F) varía entre la
 * build de ICU del server (Node) y la del navegador y provoca un hydration mismatch en SSR.
 */
const dateTimeFormatter = new Intl.DateTimeFormat("es-CO", {
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
});

export function formatDateTime(isoDate: string): string {
	return dateTimeFormatter.format(new Date(isoDate));
}

/** "Hace 5min" / "Hace 3h" / "Hace 4d", relativo al momento en que se renderiza. */
export function formatRelativeTime(isoDate: string): string {
	const diffMinutes = Math.round(
		(Date.now() - new Date(isoDate).getTime()) / 60_000,
	);
	if (diffMinutes < 1) return "Justo ahora";
	if (diffMinutes < 60) return `Hace ${diffMinutes}min`;
	const diffHours = Math.round(diffMinutes / 60);
	if (diffHours < 24) return `Hace ${diffHours}h`;
	const diffDays = Math.round(diffHours / 24);
	return `Hace ${diffDays}d`;
}
