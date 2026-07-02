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
