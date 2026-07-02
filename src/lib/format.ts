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
