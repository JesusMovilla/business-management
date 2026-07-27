import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db/client";
import {
	cashClosingItems,
	cashClosings,
	categories,
	products,
	stockMovements,
} from "@/db/schema";
import type { DateRange } from "@/modules/rentabilidad/period";
import { expenseRepository } from "./expense-repository";
import { productRepository } from "./product-repository";

/** Ventana usada para indicadores de inventario (velocidad, sell-through, rotación) — son
 * "foto de hoy" del comportamiento reciente, independientes del período elegido en el selector
 * (mismo criterio que `expectedProfit` en el módulo Proyección). */
const INVENTORY_WINDOW_DAYS = 30;
/** Umbral de días sin venta para considerar un producto "detenido". */
const STALLED_THRESHOLD_DAYS = 45;

function toDateOnly(date: Date): string {
	return format(date, "yyyy-MM-dd");
}

export function previousPeriod(range: DateRange): DateRange {
	const fromDate = parseISO(range.from);
	const toDate = parseISO(range.to);
	const lengthDays = differenceInCalendarDays(toDate, fromDate) + 1;
	const previousTo = subDays(fromDate, 1);
	const previousFrom = subDays(previousTo, lengthDays - 1);
	return { from: toDateOnly(previousFrom), to: toDateOnly(previousTo) };
}

function percentChange(current: number, previous: number): number | null {
	if (previous === 0) return null;
	return ((current - previous) / previous) * 100;
}

interface SaleRow {
	date: string;
	productId: string;
	productName: string;
	presentation: string;
	categoryId: string;
	categoryName: string;
	quantitySold: number;
	unitPrice: number;
	/** `unit_cost` con snapshot al momento del cierre, o el costo vigente si no hay snapshot. */
	unitCost: number;
	hasSnapshot: boolean;
}

/**
 * Filas de venta (una por línea de `cash_closing_items`) dentro de `range`, con el nombre y
 * categoría del producto ya resueltos. Base para todas las agregaciones del módulo — se pide una
 * sola vez por rango y se agrega en JS (ver `docs/MODULES.md`: agregaciones de dashboard en JS,
 * no SQL agregado, salvo que el volumen lo justifique).
 */
async function getSaleRows(range: DateRange): Promise<SaleRow[]> {
	const rows = await db
		.select({
			date: cashClosings.date,
			productId: cashClosingItems.productId,
			productName: products.name,
			presentation: products.presentation,
			categoryId: products.categoryId,
			categoryName: categories.name,
			quantitySold: cashClosingItems.quantitySold,
			unitPrice: cashClosingItems.unitPrice,
			unitCost: cashClosingItems.unitCost,
			cost: products.cost,
		})
		.from(cashClosingItems)
		.innerJoin(
			cashClosings,
			eq(cashClosingItems.cashClosingId, cashClosings.id),
		)
		.innerJoin(products, eq(cashClosingItems.productId, products.id))
		.innerJoin(categories, eq(products.categoryId, categories.id))
		.where(
			and(gte(cashClosings.date, range.from), lte(cashClosings.date, range.to)),
		);

	return rows.map((row) => ({
		date: row.date,
		productId: row.productId,
		productName: row.productName,
		presentation: row.presentation,
		categoryId: row.categoryId,
		categoryName: row.categoryName,
		quantitySold: row.quantitySold,
		unitPrice: row.unitPrice,
		unitCost: row.unitCost ?? row.cost,
		hasSnapshot: row.unitCost !== null,
	}));
}

function rowRevenue(row: SaleRow): number {
	return row.unitPrice * row.quantitySold;
}
function rowCost(row: SaleRow): number {
	return row.unitCost * row.quantitySold;
}
function rowProfit(row: SaleRow): number {
	return (row.unitPrice - row.unitCost) * row.quantitySold;
}

async function expensesInRange(
	range: DateRange,
): Promise<{ total: number; fixedTotal: number }> {
	const expenses = await expenseRepository.list();
	let total = 0;
	let fixedTotal = 0;
	for (const expense of expenses) {
		if (expense.status === "anulado") continue;
		if (expense.date < range.from || expense.date > range.to) continue;
		total += expense.amount;
		if (expense.type === "fijo") fixedTotal += expense.amount;
	}
	return { total, fixedTotal };
}

export interface RentabilidadKpis {
	ventas: number;
	costoVentas: number;
	gananciaBruta: number;
	margenBrutoPercent: number | null;
	gastosOperativos: number;
	gananciaNeta: number;
	dineroRecaudado: number;
	diferenciaCaja: number;
	ticketPromedio: number;
	unidadesVendidas: number;
	numeroCierres: number;
	ventasComparisonPercent: number | null;
	gananciaBrutaComparisonPercent: number | null;
	gananciaNetaComparisonPercent: number | null;
	/** Nota de transparencia: no hay descuentos ni devoluciones capturados en el sistema — "ventas"
	 * es la única cifra disponible, no hay bruta vs. neta que distinguir. */
	notaVentasNetas: string;
}

async function computeHeadline(range: DateRange) {
	const [rows, cierres, expenses] = await Promise.all([
		getSaleRows(range),
		db
			.select()
			.from(cashClosings)
			.where(
				and(
					gte(cashClosings.date, range.from),
					lte(cashClosings.date, range.to),
				),
			),
		expensesInRange(range),
	]);

	const ventas = rows.reduce((t, r) => t + rowRevenue(r), 0);
	const costoVentas = rows.reduce((t, r) => t + rowCost(r), 0);
	const gananciaBruta = ventas - costoVentas;
	const unidadesVendidas = rows.reduce((t, r) => t + r.quantitySold, 0);
	const dineroRecaudado = cierres.reduce((t, c) => t + c.actualCash, 0);
	const diferenciaCaja = cierres.reduce((t, c) => t + c.difference, 0);
	const gananciaNeta = gananciaBruta - expenses.total;

	return {
		ventas,
		costoVentas,
		gananciaBruta,
		gananciaNeta,
		unidadesVendidas,
		dineroRecaudado,
		diferenciaCaja,
		numeroCierres: cierres.length,
		gastosOperativos: expenses.total,
	};
}

export const rentabilidadDashboardRepository = {
	async getKpis(range: DateRange): Promise<RentabilidadKpis> {
		const [current, previous] = await Promise.all([
			computeHeadline(range),
			computeHeadline(previousPeriod(range)),
		]);

		return {
			ventas: current.ventas,
			costoVentas: current.costoVentas,
			gananciaBruta: current.gananciaBruta,
			margenBrutoPercent:
				current.ventas > 0
					? (current.gananciaBruta / current.ventas) * 100
					: null,
			gastosOperativos: current.gastosOperativos,
			gananciaNeta: current.gananciaNeta,
			dineroRecaudado: current.dineroRecaudado,
			diferenciaCaja: current.diferenciaCaja,
			ticketPromedio:
				current.numeroCierres > 0 ? current.ventas / current.numeroCierres : 0,
			unidadesVendidas: current.unidadesVendidas,
			numeroCierres: current.numeroCierres,
			ventasComparisonPercent: percentChange(current.ventas, previous.ventas),
			gananciaBrutaComparisonPercent: percentChange(
				current.gananciaBruta,
				previous.gananciaBruta,
			),
			gananciaNetaComparisonPercent: percentChange(
				current.gananciaNeta,
				previous.gananciaNeta,
			),
			notaVentasNetas:
				'El sistema no registra descuentos por línea ni devoluciones: "ventas" es la única cifra disponible.',
		};
	},

	/** Ventas, ganancia bruta y gastos por día — base de la gráfica combinada de tendencia. */
	async getCombinedTrend(
		range: DateRange,
	): Promise<
		{ date: string; ventas: number; gananciaBruta: number; gastos: number }[]
	> {
		const [rows, expenses] = await Promise.all([
			getSaleRows(range),
			expenseRepository.list(),
		]);

		const byDate = new Map<
			string,
			{ ventas: number; gananciaBruta: number; gastos: number }
		>();
		for (const row of rows) {
			const entry = byDate.get(row.date) ?? {
				ventas: 0,
				gananciaBruta: 0,
				gastos: 0,
			};
			entry.ventas += rowRevenue(row);
			entry.gananciaBruta += rowProfit(row);
			byDate.set(row.date, entry);
		}
		for (const expense of expenses) {
			if (expense.status === "anulado") continue;
			if (expense.date < range.from || expense.date > range.to) continue;
			const entry = byDate.get(expense.date) ?? {
				ventas: 0,
				gananciaBruta: 0,
				gastos: 0,
			};
			entry.gastos += expense.amount;
			byDate.set(expense.date, entry);
		}

		return Array.from(byDate.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([date, v]) => ({ date, ...v }));
	},

	/** Ganancia y venta agrupadas por categoría, ordenadas por ganancia (no por venta) — un
	 * producto/categoría puede vender mucho y dejar poca ganancia. */
	async getProfitByCategory(
		range: DateRange,
	): Promise<
		{ categoryId: string; name: string; ventas: number; ganancia: number }[]
	> {
		const rows = await getSaleRows(range);
		const byCategory = new Map<
			string,
			{ name: string; ventas: number; ganancia: number }
		>();
		for (const row of rows) {
			const entry = byCategory.get(row.categoryId) ?? {
				name: row.categoryName,
				ventas: 0,
				ganancia: 0,
			};
			entry.ventas += rowRevenue(row);
			entry.ganancia += rowProfit(row);
			byCategory.set(row.categoryId, entry);
		}
		return Array.from(byCategory.entries())
			.map(([categoryId, v]) => ({ categoryId, ...v }))
			.sort((a, b) => b.ganancia - a.ganancia);
	},

	/**
	 * Rentabilidad por producto dentro de `range`: ventas, costo, ganancia, participación y
	 * clasificación ABC por ventas y por ganancia (pueden diferir — ver `docs` del módulo).
	 */
	async getProductProfitability(range: DateRange) {
		const [rows, productsWithQty] = await Promise.all([
			getSaleRows(range),
			productRepository.listWithQuantity(),
		]);

		const stockByProduct = new Map(
			productsWithQty.map((p) => [p.id, p.stock.quantity]),
		);
		// Precio de lista *actual* del producto — puede diferir del precio al que efectivamente se
		// vendió en el período (`precioVentaPromedio` abajo, calculado desde `unit_price` histórico
		// de `cash_closing_items`, no desde `products.retail_price`), si el precio cambió después.
		const currentRetailPriceByProduct = new Map(
			productsWithQty.map((p) => [p.id, p.pricing.retailPrice]),
		);

		const byProduct = new Map<
			string,
			{
				name: string;
				presentation: string;
				categoryName: string;
				unidadesVendidas: number;
				ventas: number;
				costoTotal: number;
				gananciaBruta: number;
				ultimaVenta: string;
			}
		>();
		for (const row of rows) {
			const entry = byProduct.get(row.productId) ?? {
				name: row.productName,
				presentation: row.presentation,
				categoryName: row.categoryName,
				unidadesVendidas: 0,
				ventas: 0,
				costoTotal: 0,
				gananciaBruta: 0,
				ultimaVenta: row.date,
			};
			entry.unidadesVendidas += row.quantitySold;
			entry.ventas += rowRevenue(row);
			entry.costoTotal += rowCost(row);
			entry.gananciaBruta += rowProfit(row);
			if (row.date > entry.ultimaVenta) entry.ultimaVenta = row.date;
			byProduct.set(row.productId, entry);
		}

		const totalVentas = Array.from(byProduct.values()).reduce(
			(t, p) => t + p.ventas,
			0,
		);
		const totalGanancia = Array.from(byProduct.values()).reduce(
			(t, p) => t + p.gananciaBruta,
			0,
		);

		const list = Array.from(byProduct.entries()).map(([productId, p]) => ({
			productId,
			...p,
			margenPercent: p.ventas > 0 ? (p.gananciaBruta / p.ventas) * 100 : null,
			participacionVentasPercent:
				totalVentas > 0 ? (p.ventas / totalVentas) * 100 : 0,
			participacionGananciaPercent:
				totalGanancia !== 0 ? (p.gananciaBruta / totalGanancia) * 100 : 0,
			inventarioDisponible: stockByProduct.get(productId) ?? 0,
			// Precio real al que se vendió en promedio, no el precio de lista actual del producto —
			// pueden diferir si el precio cambió desde entonces.
			precioVentaPromedio:
				p.unidadesVendidas > 0 ? p.ventas / p.unidadesVendidas : null,
			precioListaActual: currentRetailPriceByProduct.get(productId) ?? null,
		}));

		return classifyAbc(list);
	},

	getInventoryIndicators,
	getAlerts,
	getProjection,
	getBreakEven,
	getDataQuality,
};

/** Clasificación ABC (regla 80/20) por ventas y por ganancia bruta, sobre la lista ya ordenada por
 * cada criterio: acumula participación hasta 80% (A), hasta 95% (B), resto (C). */
function classifyAbc<
	T extends {
		participacionVentasPercent: number;
		participacionGananciaPercent: number;
	},
>(
	list: T[],
): (T & { abcVentas: "A" | "B" | "C"; abcGanancia: "A" | "B" | "C" })[] {
	function abcRank(
		items: T[],
		key: "participacionVentasPercent" | "participacionGananciaPercent",
	): Map<T, "A" | "B" | "C"> {
		const sorted = [...items].sort((a, b) => b[key] - a[key]);
		const result = new Map<T, "A" | "B" | "C">();
		let cumulative = 0;
		for (const item of sorted) {
			cumulative += Math.max(item[key], 0);
			result.set(item, cumulative <= 80 ? "A" : cumulative <= 95 ? "B" : "C");
		}
		return result;
	}

	const byVentas = abcRank(list, "participacionVentasPercent");
	const byGanancia = abcRank(list, "participacionGananciaPercent");

	return list.map((item) => ({
		...item,
		abcVentas: byVentas.get(item) ?? "C",
		abcGanancia: byGanancia.get(item) ?? "C",
	}));
}

export interface InventoryIndicatorRow {
	productId: string;
	name: string;
	presentation: string;
	quantity: number;
	cost: number;
	retailPrice: number;
	unidadesVendidasVentana: number;
	velocidadDiaria: number;
	sellThroughPercent: number | null;
	diasCobertura: number | null;
	rotacion: number | null;
	ultimaVenta: string | null;
	diasSinVenta: number | null;
	rangoAntiguedad:
		| "0-30"
		| "31-60"
		| "61-90"
		| "91-180"
		| "+180"
		| "sin entradas";
	detenido: boolean;
	capitalInmovilizado: number;
}

/** Indicadores de inventario: sell-through, velocidad, cobertura, rotación y antigüedad, sobre una
 * ventana fija de `INVENTORY_WINDOW_DAYS` días — no depende del período elegido en el dashboard
 * (mismo criterio que `expectedProfit` del módulo Proyección: es una foto de hoy). */
async function getInventoryIndicators(): Promise<InventoryIndicatorRow[]> {
	const today = toDateOnly(new Date());
	const windowStart = toDateOnly(subDays(new Date(), INVENTORY_WINDOW_DAYS));
	const windowRange: DateRange = { from: windowStart, to: today };

	const [rows, productsWithQty, entryRows] = await Promise.all([
		getSaleRows(windowRange),
		productRepository.listWithQuantity(),
		db.select().from(stockMovements).where(eq(stockMovements.type, "entrada")),
	]);

	const salesByProduct = new Map<string, { units: number; lastSale: string }>();
	for (const row of rows) {
		const entry = salesByProduct.get(row.productId) ?? {
			units: 0,
			lastSale: row.date,
		};
		entry.units += row.quantitySold;
		if (row.date > entry.lastSale) entry.lastSale = row.date;
		salesByProduct.set(row.productId, entry);
	}

	const lastEntryByProduct = new Map<string, string>();
	for (const movement of entryRows) {
		const current = lastEntryByProduct.get(movement.productId);
		if (!current || movement.date > current) {
			lastEntryByProduct.set(movement.productId, movement.date);
		}
	}

	const result: InventoryIndicatorRow[] = [];
	for (const product of productsWithQty) {
		if (!product.active) continue;

		const sales = salesByProduct.get(product.id);
		const velocidadDiaria = (sales?.units ?? 0) / INVENTORY_WINDOW_DAYS;
		const availableForSale = product.stock.quantity + (sales?.units ?? 0);
		const sellThroughPercent =
			availableForSale > 0
				? ((sales?.units ?? 0) / availableForSale) * 100
				: null;
		const diasCobertura =
			velocidadDiaria > 0 ? product.stock.quantity / velocidadDiaria : null;
		const rotacion =
			product.stock.quantity > 0
				? (sales?.units ?? 0) / product.stock.quantity
				: null;

		const lastEntry = lastEntryByProduct.get(product.id) ?? null;
		const ageDays = lastEntry
			? differenceInCalendarDays(new Date(), parseISO(lastEntry))
			: null;
		const rangoAntiguedad: InventoryIndicatorRow["rangoAntiguedad"] =
			ageDays === null
				? "sin entradas"
				: ageDays <= 30
					? "0-30"
					: ageDays <= 60
						? "31-60"
						: ageDays <= 90
							? "61-90"
							: ageDays <= 180
								? "91-180"
								: "+180";

		const diasSinVenta = sales?.lastSale
			? differenceInCalendarDays(new Date(), parseISO(sales.lastSale))
			: null;
		const detenido =
			product.stock.quantity > 0 &&
			(diasSinVenta === null || diasSinVenta >= STALLED_THRESHOLD_DAYS);

		result.push({
			productId: product.id,
			name: product.name,
			presentation: product.presentation,
			quantity: product.stock.quantity,
			cost: product.pricing.cost,
			retailPrice: product.pricing.retailPrice,
			unidadesVendidasVentana: sales?.units ?? 0,
			velocidadDiaria,
			sellThroughPercent,
			diasCobertura,
			rotacion,
			ultimaVenta: sales?.lastSale ?? null,
			diasSinVenta,
			rangoAntiguedad,
			detenido,
			capitalInmovilizado: detenido
				? product.stock.quantity * product.pricing.cost
				: 0,
		});
	}
	return result;
}

export interface RentabilidadAlert {
	severity: "critico" | "advertencia" | "info";
	title: string;
	description: string;
	recommendation: string;
}

/** Umbral de margen bruto mínimo aceptable, en %, usado para la alerta de margen bajo. */
const MIN_MARGIN_PERCENT = 15;
/** Días de cobertura restantes que disparan la alerta de "próximo a agotarse". */
const LOW_COVERAGE_DAYS = 10;

async function getAlerts(range: DateRange): Promise<RentabilidadAlert[]> {
	const [products_, inventory, closings] = await Promise.all([
		rentabilidadDashboardRepository.getProductProfitability(range),
		getInventoryIndicators(),
		db
			.select()
			.from(cashClosings)
			.where(
				and(
					gte(cashClosings.date, range.from),
					lte(cashClosings.date, range.to),
				),
			),
	]);

	const alerts: RentabilidadAlert[] = [];

	for (const product of products_) {
		if (product.margenPercent !== null && product.margenPercent < 0) {
			alerts.push({
				severity: "critico",
				title: `${product.name} se vendió con margen negativo`,
				description: `Margen de ${product.margenPercent.toFixed(1)}% en el período (${product.presentation}).`,
				recommendation:
					"Revisa el precio de venta y el costo de compra de este producto.",
			});
		} else if (
			product.margenPercent !== null &&
			product.margenPercent < MIN_MARGIN_PERCENT
		) {
			alerts.push({
				severity: "advertencia",
				title: `${product.name} tiene margen por debajo de ${MIN_MARGIN_PERCENT}%`,
				description: `Margen actual: ${product.margenPercent.toFixed(1)}%.`,
				recommendation:
					"Evalúa ajustar precio o negociar el costo con el proveedor.",
			});
		}
		if (
			product.abcVentas === "A" &&
			(product.abcGanancia === "B" || product.abcGanancia === "C")
		) {
			alerts.push({
				severity: "advertencia",
				title: `${product.name} vende mucho pero deja poca ganancia`,
				description: `Representa ${product.participacionVentasPercent.toFixed(1)}% de las ventas pero solo ${product.participacionGananciaPercent.toFixed(1)}% de la ganancia bruta.`,
				recommendation:
					"Revisa su precio, costo o si conviene reemplazarlo por otro producto.",
			});
		}
	}

	for (const item of inventory) {
		if (item.cost <= 0) {
			alerts.push({
				severity: "advertencia",
				title: `${item.name} no tiene costo registrado`,
				description:
					"El costo del producto es 0 — la ganancia calculada no es confiable.",
				recommendation: "Actualiza el costo del producto en Inventario.",
			});
		}
		if (
			item.diasCobertura !== null &&
			item.diasCobertura <= LOW_COVERAGE_DAYS
		) {
			alerts.push({
				severity: "advertencia",
				title: `${item.name} podría agotarse en ${Math.round(item.diasCobertura)} días`,
				description: `Quedan ${item.quantity} unidades a una velocidad de venta de ${item.velocidadDiaria.toFixed(2)}/día.`,
				recommendation: "Considera hacer un nuevo pedido a proveedor pronto.",
			});
		}
		if (item.detenido && item.capitalInmovilizado > 0) {
			alerts.push({
				severity: "info",
				title: `${item.name} tiene inventario detenido`,
				description: `${item.quantity} unidades, ${item.diasSinVenta ?? "sin"} días sin venta, ${item.capitalInmovilizado.toLocaleString("es-CO")} inmovilizados.`,
				recommendation:
					"Evalúa un descuento, un combo, o detener su reposición.",
			});
		}
	}

	for (const closing of closings) {
		if (Math.abs(closing.difference) > 0) {
			alerts.push({
				severity: closing.difference < 0 ? "critico" : "info",
				title: `Cierre de caja del ${closing.date} con diferencia`,
				description: `Diferencia de ${closing.difference.toLocaleString("es-CO")} entre lo esperado y lo contado.`,
				recommendation:
					"Revisa el cierre de caja de esa fecha en el módulo Cierre de caja.",
			});
		}
	}

	return alerts.sort((a, b) => {
		const order = { critico: 0, advertencia: 1, info: 2 };
		return order[a.severity] - order[b.severity];
	});
}

export interface ProjectionResult {
	potencialMaximoIngresos: number;
	potencialMaximoGanancia: number;
	proyeccionRealistaUnidades: number;
	proyeccionRealistaGanancia: number;
	tendenciaVentasProyectadas: number;
	tendenciaGananciaProyectada: number;
	diasHistorialUsados: number;
	diasProyectados: number;
}

/** Proyección con el inventario actual: potencial máximo teórico (todo se vende a precio de lista,
 * sin roce con la realidad), proyección realista (según sell-through histórico), y una tendencia
 * simple de ventas/ganancia futuras por promedio diario del período seleccionado — "primera
 * versión" según el propio criterio del documento fuente: transparente, sin escenarios ni
 * estacionalidad avanzada. */
async function getProjection(range: DateRange): Promise<ProjectionResult> {
	const [productsWithQty, inventory, trend] = await Promise.all([
		productRepository.listWithQuantity(),
		getInventoryIndicators(),
		rentabilidadDashboardRepository.getCombinedTrend(range),
	]);

	let potencialMaximoIngresos = 0;
	let potencialMaximoGanancia = 0;
	for (const product of productsWithQty) {
		if (!product.active) continue;
		const quantity = Math.max(product.stock.quantity, 0);
		potencialMaximoIngresos += quantity * product.pricing.retailPrice;
		potencialMaximoGanancia +=
			quantity * (product.pricing.retailPrice - product.pricing.cost);
	}

	const sellThroughByProduct = new Map(
		inventory.map((i) => [i.productId, (i.sellThroughPercent ?? 0) / 100]),
	);
	let proyeccionRealistaUnidades = 0;
	let proyeccionRealistaGanancia = 0;
	for (const product of productsWithQty) {
		if (!product.active) continue;
		const probability = sellThroughByProduct.get(product.id) ?? 0;
		const quantity =
			Math.max(product.stock.quantity, 0) * Math.min(probability, 1);
		proyeccionRealistaUnidades += quantity;
		proyeccionRealistaGanancia +=
			quantity * (product.pricing.retailPrice - product.pricing.cost);
	}

	const diasHistorialUsados = trend.length;
	const diasProyectados =
		differenceInCalendarDays(parseISO(range.to), parseISO(range.from)) + 1;
	const avgVentasDiarias =
		diasHistorialUsados > 0
			? trend.reduce((t, d) => t + d.ventas, 0) / diasHistorialUsados
			: 0;
	const avgGananciaDiaria =
		diasHistorialUsados > 0
			? trend.reduce((t, d) => t + d.gananciaBruta, 0) / diasHistorialUsados
			: 0;

	return {
		potencialMaximoIngresos,
		potencialMaximoGanancia,
		proyeccionRealistaUnidades,
		proyeccionRealistaGanancia,
		tendenciaVentasProyectadas: avgVentasDiarias * diasProyectados,
		tendenciaGananciaProyectada: avgGananciaDiaria * diasProyectados,
		diasHistorialUsados,
		diasProyectados,
	};
}

export interface BreakEvenResult {
	gastosFijos: number;
	margenContribucionPromedioPercent: number | null;
	ventasParaEquilibrio: number | null;
}

/** Punto de equilibrio = gastos fijos del período ÷ margen de contribución promedio — viable
 * porque `expenses.type === "fijo"` ya distingue gastos fijos de variables. */
async function getBreakEven(range: DateRange): Promise<BreakEvenResult> {
	const [rows, expenses] = await Promise.all([
		getSaleRows(range),
		expensesInRange(range),
	]);
	const ventas = rows.reduce((t, r) => t + rowRevenue(r), 0);
	const gananciaBruta = rows.reduce((t, r) => t + rowProfit(r), 0);
	const margenContribucionPromedioPercent =
		ventas > 0 ? (gananciaBruta / ventas) * 100 : null;

	return {
		gastosFijos: expenses.fixedTotal,
		margenContribucionPromedioPercent,
		ventasParaEquilibrio:
			margenContribucionPromedioPercent && margenContribucionPromedioPercent > 0
				? expenses.fixedTotal / (margenContribucionPromedioPercent / 100)
				: null,
	};
}

export interface DataQualityResult {
	productosConCostoValidoPercent: number;
	ventasConCostoSnapshotPercent: number;
	gastosConCategoriaPercent: number;
	cierresConDiferenciaSinResolver: number;
}

/** Panel de calidad de datos: evita mostrar cifras de ganancia "exactas" cuando la información de
 * base está incompleta (mismo espíritu que la advertencia de Shopify citada en el documento
 * fuente). */
async function getDataQuality(range: DateRange): Promise<DataQualityResult> {
	const [productsWithQty, rows, expenses, closings] = await Promise.all([
		productRepository.listWithQuantity(),
		getSaleRows(range),
		expenseRepository.list(),
		db
			.select()
			.from(cashClosings)
			.where(
				and(
					gte(cashClosings.date, range.from),
					lte(cashClosings.date, range.to),
				),
			),
	]);

	const activeProducts = productsWithQty.filter((p) => p.active);
	const productosConCostoValidoPercent =
		activeProducts.length > 0
			? (activeProducts.filter((p) => p.pricing.cost > 0).length /
					activeProducts.length) *
				100
			: 100;

	const ventasConCostoSnapshotPercent =
		rows.length > 0
			? (rows.filter((r) => r.hasSnapshot).length / rows.length) * 100
			: 100;

	const expensesInRangeList = expenses.filter(
		(e) => e.status !== "anulado" && e.date >= range.from && e.date <= range.to,
	);
	const gastosConCategoriaPercent =
		expensesInRangeList.length > 0
			? (expensesInRangeList.filter((e) => !!e.categoryId).length /
					expensesInRangeList.length) *
				100
			: 100;

	return {
		productosConCostoValidoPercent,
		ventasConCostoSnapshotPercent,
		gastosConCategoriaPercent,
		cierresConDiferenciaSinResolver: closings.filter(
			(c) => Math.abs(c.difference) > 0,
		).length,
	};
}
