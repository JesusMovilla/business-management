import type { Product } from "@/types";

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
 * Nombre completo de un producto para listas donde puede haber más de uno con el mismo `name`
 * (ej. "Ron Cacique" en botella vs. en caja) — combina `name`, `presentation` y `volumeMl` en un
 * solo texto no ambiguo: "Ron Cacique — Botella 750ml".
 */
export function formatProductLabel(
	product: Pick<Product, "name" | "presentation" | "volumeMl">,
): string {
	const details = [
		product.presentation,
		product.volumeMl ? `${product.volumeMl}ml` : undefined,
	]
		.filter(Boolean)
		.join(" ");
	return details ? `${product.name} — ${details}` : product.name;
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
