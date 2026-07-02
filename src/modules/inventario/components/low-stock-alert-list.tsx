"use client";

import { AlertTriangle, XCircle } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useProducts } from "../hooks/use-products";

export function LowStockAlertList() {
	const products = useProducts();

	const { critico, bajo } = useMemo(() => {
		const lowStock = products.filter((p) => p.stockStatus !== "ok");
		return {
			critico: lowStock.filter((p) => p.stockStatus === "critico"),
			bajo: lowStock.filter((p) => p.stockStatus === "bajo"),
		};
	}, [products]);

	if (critico.length === 0 && bajo.length === 0) {
		return (
			<p className="text-muted-foreground py-8 text-center">
				No hay alertas de stock por ahora.
			</p>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			{critico.length > 0 && (
				<section className="flex flex-col gap-3">
					<h2 className="text-sm font-semibold text-destructive">
						Crítico ({critico.length})
					</h2>
					{critico.map((product) => (
						<Alert key={product.id} variant="destructive">
							<XCircle className="size-4" />
							<AlertTitle>
								<Link
									href={`/inventario/${product.id}`}
									className="hover:underline"
								>
									{product.name}
								</Link>
							</AlertTitle>
							<AlertDescription>
								Sin existencias ({product.stock.quantity} unidades, mínimo{" "}
								{product.stock.minStock}).
							</AlertDescription>
						</Alert>
					))}
				</section>
			)}
			{bajo.length > 0 && (
				<section className="flex flex-col gap-3">
					<h2 className="text-sm font-semibold">Stock bajo ({bajo.length})</h2>
					{bajo.map((product) => (
						<Alert key={product.id}>
							<AlertTriangle className="size-4" />
							<AlertTitle>
								<Link
									href={`/inventario/${product.id}`}
									className="hover:underline"
								>
									{product.name}
								</Link>
							</AlertTitle>
							<AlertDescription>
								{product.stock.quantity} unidades disponibles, mínimo{" "}
								{product.stock.minStock}.
							</AlertDescription>
						</Alert>
					))}
				</section>
			)}
		</div>
	);
}
