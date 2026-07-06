"use client";

import Link from "next/link";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { useCategories, useProduct } from "../hooks/use-products";
import { StockBadge } from "./stock-badge";
import { StockMovementActions } from "./stock-movement-actions";
import { StockMovementHistory } from "./stock-movement-history";

export function ProductDetail({ productId }: { productId: string }) {
	const product = useProduct(productId);
	const categories = useCategories();

	if (!product) {
		return (
			<div className="flex flex-col items-center gap-3 py-16 text-center">
				<p className="text-muted-foreground">
					No se encontró el producto solicitado.
				</p>
				<Button render={<Link href="/inventario" />}>
					Volver al inventario
				</Button>
			</div>
		);
	}

	const categoryName =
		categories.find((c) => c.id === product.categoryId)?.name ?? "—";

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">{product.name}</h1>
					<p className="text-muted-foreground text-sm">
						{product.brand} · {product.presentation}
					</p>
				</div>
				<PermissionGuard module="inventario" action="editar">
					<Button render={<Link href={`/inventario/${product.id}/editar`} />}>
						Editar
					</Button>
				</PermissionGuard>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Datos básicos</CardTitle>
				</CardHeader>
				<CardContent className="grid grid-cols-2 gap-4 text-sm">
					<Info label="Categoría" value={categoryName} />
					<Info label="Presentación" value={product.presentation} />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Stock</CardTitle>
				</CardHeader>
				<CardContent className="grid grid-cols-2 gap-4 text-sm">
					<Info
						label="Cantidad"
						value={
							<StockBadge
								status={product.stockStatus}
								quantity={product.stock.quantity}
							/>
						}
					/>
					<Info label="Stock mínimo" value={String(product.stock.minStock)} />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Movimientos</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<StockMovementActions productId={product.id} />
					<StockMovementHistory productId={product.id} />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Precios y márgenes</CardTitle>
				</CardHeader>
				<CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
					<Info label="Costo" value={formatCurrency(product.pricing.cost)} />
					<Info
						label="Precio público"
						value={`${formatCurrency(product.pricing.retailPrice)} (${formatPercent(product.marginRetail)})`}
					/>
					<Info label="Última compra" value={product.lastPurchaseDate ?? "—"} />
				</CardContent>
			</Card>
		</div>
	);
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-muted-foreground text-xs">{label}</span>
			<span className="font-medium">{value}</span>
		</div>
	);
}
