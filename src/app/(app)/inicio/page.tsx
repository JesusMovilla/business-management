import {
	AlertTriangle,
	Boxes,
	CalendarDays,
	TrendingUp,
	Trophy,
	Wallet,
} from "lucide-react";
import nextDynamic from "next/dynamic";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { dashboardRepository } from "@/data/repositories/dashboard-repository";
import { productRepository } from "@/data/repositories/product-repository";
import { stockMovementRepository } from "@/data/repositories/stock-movement-repository";
import { formatCurrency } from "@/lib/format";
import { PeriodSelector } from "@/modules/inicio/components/period-selector";
import {
	type RecentMovementRow,
	RecentMovementsCard,
} from "@/modules/inicio/components/recent-movements-card";
import { ReconciliationStatusCard } from "@/modules/inicio/components/reconciliation-status-card";
import { UpcomingEventsWidget } from "@/modules/inicio/components/upcoming-events-widget";

// Recharts es pesado — se separa en su propio chunk en vez de sumarse al bundle de esta ruta.
// `ssr:false` no está permitido acá (Server Component): esta página ya es `force-dynamic`, así
// que no hay nada que ganar cacheando su HTML de todos modos.
const ChartSkeleton = <Skeleton className="aspect-auto h-64 w-full" />;
const RevenueTrendChart = nextDynamic(
	() =>
		import("@/modules/inicio/components/revenue-trend-chart").then(
			(mod) => mod.RevenueTrendChart,
		),
	{ loading: () => ChartSkeleton },
);
const RankedBarChart = nextDynamic(
	() =>
		import("@/modules/inicio/components/ranked-bar-chart").then(
			(mod) => mod.RankedBarChart,
		),
	{ loading: () => ChartSkeleton },
);

// Todos los datos vienen de Postgres en vivo (Cierre de caja, Inventario) — sin snapshot de build.
export const dynamic = "force-dynamic";

const RANGE_DAYS = [7, 30, 90];

function parseRangeDays(value: string | undefined): number {
	const parsed = Number(value);
	return RANGE_DAYS.includes(parsed) ? parsed : 30;
}

function formatDateLong(dateIso: string): string {
	const [year, month, day] = dateIso.split("-");
	return `${day}/${month}/${year}`;
}

export default async function InicioPage({
	searchParams,
}: {
	searchParams: Promise<{ range?: string }>;
}) {
	const { range } = await searchParams;
	const days = parseRangeDays(range);

	const [
		kpis,
		revenueTrend,
		topProducts,
		reconciliation,
		stockByCategory,
		topSalesDay,
		movements,
		products,
	] = await Promise.all([
		dashboardRepository.getKpis(),
		dashboardRepository.getRevenueTrend(days),
		dashboardRepository.getTopProducts(days),
		dashboardRepository.getReconciliationBreakdown(days),
		dashboardRepository.getStockByCategory(),
		dashboardRepository.getTopSalesDay(),
		stockMovementRepository.listAll(),
		productRepository.listWithQuantity(),
	]);

	const productNameById = new Map(products.map((p) => [p.id, p.name]));
	const recentMovements: RecentMovementRow[] = [...movements]
		.sort((a, b) => b.date.localeCompare(a.date))
		.slice(0, 5)
		.map((movement) => ({
			movement,
			productName:
				productNameById.get(movement.productId) ?? "Producto eliminado",
		}));

	const lowStockTotal = kpis.lowStockCount + kpis.criticalStockCount;
	const stockTone =
		kpis.criticalStockCount > 0
			? "critical"
			: kpis.lowStockCount > 0
				? "warning"
				: "default";

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="font-semibold text-2xl">Inicio</h1>
				<p className="text-muted-foreground text-sm">
					Estadísticas generales del negocio.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<PermissionGuard module="cierre-caja" action="ver">
					<StatTile
						label="Ingreso del mes"
						value={formatCurrency(kpis.revenueThisMonth)}
						icon={TrendingUp}
						href="/cierre-caja"
					/>
				</PermissionGuard>
				<PermissionGuard module="cierre-caja" action="ver">
					<StatTile
						label="Unidades vendidas (mes)"
						value={kpis.unitsSoldThisMonth}
						icon={Trophy}
						href="/cierre-caja"
					/>
				</PermissionGuard>
				<PermissionGuard module="inventario" action="ver">
					<StatTile
						label="Alertas de stock"
						value={lowStockTotal}
						icon={AlertTriangle}
						href="/inventario/alertas"
						tone={stockTone as "default" | "warning" | "critical"}
						description={`${kpis.criticalStockCount} crítico · ${kpis.lowStockCount} bajo`}
					/>
				</PermissionGuard>
				<PermissionGuard module="inventario" action="ver">
					<StatTile
						label="Valor de inventario"
						value={formatCurrency(kpis.inventoryValue)}
						icon={Boxes}
						href="/inventario"
					/>
				</PermissionGuard>
			</div>

			<PermissionGuard module="cierre-caja" action="ver">
				{topSalesDay && (
					<StatTile
						label="Día con más venta"
						value={formatCurrency(topSalesDay.expectedIncome)}
						icon={Wallet}
						description={formatDateLong(topSalesDay.date)}
						href={`/cierre-caja/${topSalesDay.closingId}`}
					/>
				)}
			</PermissionGuard>

			<PermissionGuard module="cierre-caja" action="ver">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<h2 className="font-semibold text-lg">Ventas</h2>
					<PeriodSelector activeDays={days} />
				</div>
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Tendencia de ingresos</CardTitle>
						</CardHeader>
						<CardContent>
							<RevenueTrendChart data={revenueTrend} />
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Producto más vendido</CardTitle>
						</CardHeader>
						<CardContent>
							<RankedBarChart
								valueLabel="Unidades"
								data={topProducts.map((product) => ({
									id: product.productId,
									label: product.name,
									value: product.quantitySold,
									href: `/inventario/${product.productId}`,
								}))}
							/>
						</CardContent>
					</Card>
				</div>
				<Card>
					<CardHeader>
						<CardTitle>Estado de conciliación</CardTitle>
					</CardHeader>
					<CardContent>
						<ReconciliationStatusCard data={reconciliation} />
					</CardContent>
				</Card>
			</PermissionGuard>

			<PermissionGuard module="inventario" action="ver">
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Stock por categoría</CardTitle>
						</CardHeader>
						<CardContent>
							<RankedBarChart
								valueLabel="Unidades en stock"
								data={stockByCategory.map((category) => ({
									id: category.categoryId,
									label: category.categoryName,
									value: category.quantity,
								}))}
							/>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Movimientos recientes</CardTitle>
						</CardHeader>
						<CardContent>
							<RecentMovementsCard rows={recentMovements} />
						</CardContent>
					</Card>
				</div>
			</PermissionGuard>

			<PermissionGuard module="calendario" action="ver">
				<div className="flex items-center gap-2">
					<CalendarDays className="size-4 text-muted-foreground" />
					<h2 className="font-semibold text-lg">Calendario</h2>
				</div>
				<UpcomingEventsWidget />
			</PermissionGuard>
		</div>
	);
}
