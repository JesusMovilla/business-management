"use client";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useProductFilters } from "../hooks/use-product-filters";
import { useProducts } from "../hooks/use-products";
import { isLowMargin } from "../lib/calc-margin";
import { ProductFiltersBar } from "./product-filters";

export function PriceMarginTable() {
	const products = useProducts();
	const { filters, setFilters, filtered } = useProductFilters(products);

	return (
		<div className="flex flex-col gap-4">
			<ProductFiltersBar filters={filters} onChange={setFilters} />
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>SKU</TableHead>
							<TableHead>Nombre</TableHead>
							<TableHead>Costo</TableHead>
							<TableHead>Precio público</TableHead>
							<TableHead>Margen público</TableHead>
							<TableHead>Precio mayorista</TableHead>
							<TableHead>Margen mayorista</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filtered.map((product) => (
							<TableRow key={product.id}>
								<TableCell className="font-mono text-xs">
									{product.sku}
								</TableCell>
								<TableCell className="font-medium">{product.name}</TableCell>
								<TableCell>{formatCurrency(product.pricing.cost)}</TableCell>
								<TableCell>
									{formatCurrency(product.pricing.retailPrice)}
								</TableCell>
								<TableCell
									className={cn(
										isLowMargin(product.marginRetail) &&
											"text-destructive font-medium",
									)}
								>
									{formatPercent(product.marginRetail)}
								</TableCell>
								<TableCell>
									{formatCurrency(product.pricing.wholesalePrice)}
								</TableCell>
								<TableCell
									className={cn(
										isLowMargin(product.marginWholesale) &&
											"text-destructive font-medium",
									)}
								>
									{formatPercent(product.marginWholesale)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
