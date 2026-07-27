import nextDynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { productRepository } from "@/data/repositories/product-repository";
import { rentabilidadDashboardRepository } from "@/data/repositories/rentabilidad-dashboard-repository";
import { AlertsList } from "@/modules/rentabilidad/components/alerts-list";
import { BreakEvenCard } from "@/modules/rentabilidad/components/break-even-card";
import { DataQualityPanel } from "@/modules/rentabilidad/components/data-quality-panel";
import { InventoryIndicatorsTable } from "@/modules/rentabilidad/components/inventory-indicators-table";
import { PriceSimulator } from "@/modules/rentabilidad/components/price-simulator";
import type { ProductProfitabilityRow } from "@/modules/rentabilidad/components/product-profitability-columns";
import { ProductProfitabilityTable } from "@/modules/rentabilidad/components/product-profitability-table";
import { ProfitBridge } from "@/modules/rentabilidad/components/profit-bridge";
import { ProjectionCard } from "@/modules/rentabilidad/components/projection-card";
import { RentabilidadKpiCards } from "@/modules/rentabilidad/components/rentabilidad-kpi-cards";
import { RentabilidadPeriodSelector } from "@/modules/rentabilidad/components/rentabilidad-period-selector";
import { classifyQuadrant } from "@/modules/rentabilidad/lib/quadrant";
import {
	formatPeriodLabel,
	resolvePeriod,
} from "@/modules/rentabilidad/period";

const ChartSkeleton = <Skeleton className="aspect-auto h-64 w-full" />;
const CombinedTrendChart = nextDynamic(
	() =>
		import("@/modules/rentabilidad/components/combined-trend-chart").then(
			(mod) => mod.CombinedTrendChart,
		),
	{ loading: () => ChartSkeleton },
);
const CategoryProfitChart = nextDynamic(
	() =>
		import("@/modules/rentabilidad/components/category-profit-chart").then(
			(mod) => mod.CategoryProfitChart,
		),
	{ loading: () => ChartSkeleton },
);
const ProductProfitChart = nextDynamic(
	() =>
		import("@/modules/rentabilidad/components/product-profit-chart").then(
			(mod) => mod.ProductProfitChart,
		),
	{ loading: () => ChartSkeleton },
);

// La ganancia real depende de Cierre de caja, Inventario y Gastos en Postgres: renderizar por
// request, igual que el módulo Proyección.
export const dynamic = "force-dynamic";

export default async function RentabilidadPage({
	searchParams,
}: {
	searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
	const params = await searchParams;
	const { period, range } = resolvePeriod(params);
	const periodLabel = formatPeriodLabel(period, range);

	const [
		kpis,
		combinedTrend,
		categoryProfit,
		productProfitability,
		inventoryIndicators,
		alerts,
		projection,
		breakEven,
		dataQuality,
		productsWithQty,
	] = await Promise.all([
		rentabilidadDashboardRepository.getKpis(range),
		rentabilidadDashboardRepository.getCombinedTrend(range),
		rentabilidadDashboardRepository.getProfitByCategory(range),
		rentabilidadDashboardRepository.getProductProfitability(range),
		rentabilidadDashboardRepository.getInventoryIndicators(),
		rentabilidadDashboardRepository.getAlerts(range),
		rentabilidadDashboardRepository.getProjection(range),
		rentabilidadDashboardRepository.getBreakEven(range),
		rentabilidadDashboardRepository.getDataQuality(range),
		productRepository.listWithQuantity(),
	]);

	const quadrantByProduct = classifyQuadrant(productProfitability);
	const productRows: ProductProfitabilityRow[] = productProfitability.map(
		(p) => ({
			...p,
			quadrant: quadrantByProduct.get(p) ?? "baja-venta-baja-ganancia",
		}),
	);

	const simulatorProducts = productsWithQty
		.filter((p) => p.active)
		.map((p) => ({
			id: p.id,
			name: p.name,
			presentation: p.presentation,
			cost: p.pricing.cost,
			retailPrice: p.pricing.retailPrice,
		}));

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">
						Rentabilidad y proyecciones
					</h1>
					<p className="text-muted-foreground text-sm">
						Ganancia realizada, ganancia neta estimada, efectivo generado y
						ganancia potencial del inventario — con acciones recomendadas.
					</p>
				</div>
			</div>

			<RentabilidadPeriodSelector activePeriod={period} range={range} />

			<RentabilidadKpiCards kpis={kpis} periodLabel={periodLabel} />

			<Card>
				<CardHeader>
					<CardTitle>Ventas, ganancia bruta y gastos ({periodLabel})</CardTitle>
				</CardHeader>
				<CardContent>
					<CombinedTrendChart data={combinedTrend} />
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Ganancia por categoría ({periodLabel})</CardTitle>
						<p className="text-muted-foreground text-sm">
							Ordenado por ganancia, no por venta.
						</p>
					</CardHeader>
					<CardContent>
						<CategoryProfitChart
							data={categoryProfit.map((c) => ({
								id: c.categoryId,
								label: c.name,
								value: c.ganancia,
							}))}
						/>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Ganancia por producto ({periodLabel})</CardTitle>
						<p className="text-muted-foreground text-sm">
							Top 5 por ganancia — el tooltip muestra unidades vendidas.
						</p>
					</CardHeader>
					<CardContent>
						<ProductProfitChart
							data={[...productRows]
								.sort((a, b) => b.gananciaBruta - a.gananciaBruta)
								.slice(0, 5)
								.map((p) => ({
									id: p.productId,
									label: `${p.name} (${p.presentation})`,
									ganancia: p.gananciaBruta,
									unidades: p.unidadesVendidas,
								}))}
						/>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<ProfitBridge
					ventas={kpis.ventas}
					costoVentas={kpis.costoVentas}
					gananciaBruta={kpis.gananciaBruta}
					gastos={kpis.gastosOperativos}
					gananciaNeta={kpis.gananciaNeta}
				/>
				<AlertsList alerts={alerts} />
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Rentabilidad por producto ({periodLabel})</CardTitle>
					<p className="text-muted-foreground text-sm">
						ABC por ventas y por ganancia por separado — un producto puede ser A
						en ingresos y C en rentabilidad.
					</p>
				</CardHeader>
				<CardContent>
					<ProductProfitabilityTable data={productRows} />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Indicadores de inventario</CardTitle>
					<p className="text-muted-foreground text-sm">
						Sell-through, velocidad, cobertura, rotación y antigüedad — ventana
						fija de 30 días, independiente del período elegido arriba.
					</p>
				</CardHeader>
				<CardContent>
					<InventoryIndicatorsTable data={inventoryIndicators} />
				</CardContent>
			</Card>

			<ProjectionCard projection={projection} />

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<BreakEvenCard breakEven={breakEven} />
				<DataQualityPanel quality={dataQuality} />
			</div>

			<PriceSimulator products={simulatorProducts} />
		</div>
	);
}
