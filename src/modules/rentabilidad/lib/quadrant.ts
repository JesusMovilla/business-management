export type SalesProfitQuadrant =
	| "alta-venta-alta-ganancia"
	| "alta-venta-baja-ganancia"
	| "baja-venta-alta-ganancia"
	| "baja-venta-baja-ganancia";

export const QUADRANT_LABELS: Record<SalesProfitQuadrant, string> = {
	"alta-venta-alta-ganancia": "Alta venta / alta ganancia",
	"alta-venta-baja-ganancia": "Alta venta / baja ganancia",
	"baja-venta-alta-ganancia": "Baja venta / alta ganancia",
	"baja-venta-baja-ganancia": "Baja venta / baja ganancia",
};

/**
 * Clasifica cada producto en uno de los cuatro cuadrantes venta/ganancia usando la mediana de cada
 * magnitud dentro del propio conjunto como corte "alta" vs. "baja" — permite ver productos que
 * venden mucho pero dejan poca ganancia sin necesitar un umbral fijo configurado por el usuario.
 */
export function classifyQuadrant<
	T extends { ventas: number; gananciaBruta: number },
>(items: T[]): Map<T, SalesProfitQuadrant> {
	const result = new Map<T, SalesProfitQuadrant>();
	if (items.length === 0) return result;

	const sortedVentas = [...items].map((i) => i.ventas).sort((a, b) => a - b);
	const sortedGanancia = [...items]
		.map((i) => i.gananciaBruta)
		.sort((a, b) => a - b);
	const median = (values: number[]) => values[Math.floor(values.length / 2)];
	const medianVentas = median(sortedVentas);
	const medianGanancia = median(sortedGanancia);

	for (const item of items) {
		const altaVenta = item.ventas >= medianVentas;
		const altaGanancia = item.gananciaBruta >= medianGanancia;
		result.set(
			item,
			altaVenta
				? altaGanancia
					? "alta-venta-alta-ganancia"
					: "alta-venta-baja-ganancia"
				: altaGanancia
					? "baja-venta-alta-ganancia"
					: "baja-venta-baja-ganancia",
		);
	}
	return result;
}
