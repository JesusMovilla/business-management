"use client";

import Link from "next/link";
import { RouteGuard } from "@/components/guards/route-guard";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useProduct } from "../hooks/use-products";
import { ProductForm } from "./product-form";

export function ProductEditForm({ productId }: { productId: string }) {
	const product = useProduct(productId);

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

	return (
		<RouteGuard module="inventario" action="editar">
			<div className="flex flex-col gap-6">
				<PageHeader
					title="Editar producto"
					description={product.name}
					backHref={`/inventario/${product.id}`}
				/>
				<ProductForm mode="edit" product={product} />
			</div>
		</RouteGuard>
	);
}
