import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { ProductWithQuantity } from "@/data/repositories/product-repository";
import { formatCurrency } from "@/lib/format";
import type { CashClosingItem } from "@/types";
import {
	COL_QUANTITY,
	COL_SUBTOTAL,
	COL_UNIT_PRICE,
	productLabel,
	summarizeByProduct,
} from "../lib/sale-groups";

interface CashClosingProductSummaryCardProps {
	items: CashClosingItem[];
	products: ProductWithQuantity[];
	expectedIncome: number;
}

/** Card "Detalle por producto": agrega todas las ventas del cierre por producto (cantidad,
 * precio unitario, subtotal) con el total final. */
export function CashClosingProductSummaryCard({
	items,
	products,
	expectedIncome,
}: CashClosingProductSummaryCardProps) {
	const productMap = new Map(products.map((product) => [product.id, product]));
	const productSummary = summarizeByProduct(items);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Detalle por producto</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{productSummary.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						Aún no hay ventas registradas.
					</p>
				) : (
					<>
						<div className="flex flex-col gap-2 sm:hidden">
							{productSummary.map((summary) => (
								<div key={summary.productId} className="rounded-md border p-3">
									<div className="truncate text-sm font-medium">
										{productLabel(productMap.get(summary.productId))}
									</div>
									<div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2 border-t pt-3">
										<div>
											<div className="text-muted-foreground text-xs">
												Cantidad
											</div>
											<div className="text-sm">{summary.quantitySold}</div>
										</div>
										<div>
											<div className="text-muted-foreground text-xs">
												Precio unitario
											</div>
											<div className="text-sm">
												{formatCurrency(
													summary.subtotal / summary.quantitySold,
												)}
											</div>
										</div>
										<div>
											<div className="text-muted-foreground text-xs">
												Subtotal
											</div>
											<div className="text-sm font-medium">
												{formatCurrency(summary.subtotal)}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
						<div className="hidden sm:block">
							<Table className="table-fixed">
								<TableHeader>
									<TableRow>
										<TableHead>Producto</TableHead>
										<TableHead className={COL_QUANTITY}>Cantidad</TableHead>
										<TableHead className={COL_UNIT_PRICE}>
											Precio unitario
										</TableHead>
										<TableHead className={COL_SUBTOTAL}>Subtotal</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{productSummary.map((summary) => (
										<TableRow key={summary.productId}>
											<TableCell className="truncate">
												{productLabel(productMap.get(summary.productId))}
											</TableCell>
											<TableCell className={COL_QUANTITY}>
												{summary.quantitySold}
											</TableCell>
											<TableCell className={COL_UNIT_PRICE}>
												{formatCurrency(
													summary.subtotal / summary.quantitySold,
												)}
											</TableCell>
											<TableCell className={COL_SUBTOTAL}>
												{formatCurrency(summary.subtotal)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</>
				)}
				<p className="text-lg font-semibold">
					Total: {formatCurrency(expectedIncome)}
				</p>
			</CardContent>
		</Card>
	);
}
