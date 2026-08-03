"use client";

import { ChevronDown, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { ProductWithQuantity } from "@/data/repositories/product-repository";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { CashClosingItem, CashClosingSale } from "@/types";
import {
	COL_ACTIONS,
	COL_QUANTITY,
	COL_SUBTOTAL,
	COL_UNIT_PRICE,
	groupItemsBySale,
	productLabel,
} from "../lib/sale-groups";

interface CashClosingSalesListCardProps {
	items: CashClosingItem[];
	sales: CashClosingSale[];
	products: ProductWithQuantity[];
	updateSaleItemQuantity: (itemId: string, quantitySold: number) => void;
	removeSale: (itemId: string) => void;
}

/** Input de cantidad con edición inline: confirma el cambio al perder el foco. */
function SaleItemQuantityInput({
	item,
	onCommit,
}: {
	item: CashClosingItem;
	onCommit: (quantitySold: number) => void;
}) {
	const [value, setValue] = useState(String(item.quantitySold));

	return (
		<Input
			type="number"
			min={1}
			className="w-20"
			value={value}
			onChange={(event) => setValue(event.target.value)}
			onBlur={() => {
				const quantity = Number(value);
				if (quantity > 0 && quantity !== item.quantitySold) {
					onCommit(quantity);
				} else {
					setValue(String(item.quantitySold));
				}
			}}
		/>
	);
}

/**
 * Card "Ventas registradas": agrupa los ítems del borrador por venta (`saleId`) en colapsables
 * cerrados por defecto — título = la observación de la venta si se escribió, si no "Venta N" —
 * con el método de pago como badge y el total de esa venta. Cada línea permite editar la
 * cantidad in-place o quitarla.
 */
export function CashClosingSalesListCard({
	items,
	sales,
	products,
	updateSaleItemQuantity,
	removeSale,
}: CashClosingSalesListCardProps) {
	const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());

	const productMap = new Map(products.map((product) => [product.id, product]));
	const saleGroups = groupItemsBySale(items, sales);

	const toggleSale = (key: string) => {
		setExpandedSales((current) => {
			const next = new Set(current);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Ventas registradas</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{saleGroups.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						Aún no registras ninguna venta.
					</p>
				) : (
					saleGroups.map((group, index) => {
						const open = expandedSales.has(group.key);
						const title = group.sale?.note?.trim() || `Venta ${index + 1}`;
						return (
							<Collapsible
								key={group.key}
								open={open}
								onOpenChange={() => toggleSale(group.key)}
								className="rounded-md border"
							>
								<CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-sm font-medium">
									<span className="flex min-w-0 items-center gap-2">
										<ChevronDown
											className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
										/>
										<span className="truncate">{title}</span>
										{group.sale?.paymentMethod && (
											<Badge variant="secondary" className="shrink-0">
												{group.sale.paymentMethod}
											</Badge>
										)}
										{group.createdAt && (
											<span className="shrink-0 whitespace-nowrap font-normal text-muted-foreground">
												{formatDateTime(group.createdAt)}
											</span>
										)}
									</span>
									<span className="shrink-0 font-semibold">
										{formatCurrency(group.total)}
									</span>
								</CollapsibleTrigger>
								<CollapsibleContent className="border-t px-4 py-3">
									<Table className="table-fixed">
										<TableHeader>
											<TableRow>
												<TableHead>Producto</TableHead>
												<TableHead className={COL_QUANTITY}>Cantidad</TableHead>
												<TableHead className={COL_UNIT_PRICE}>
													Precio unitario
												</TableHead>
												<TableHead className={COL_SUBTOTAL}>Subtotal</TableHead>
												<TableHead className={COL_ACTIONS} />
											</TableRow>
										</TableHeader>
										<TableBody>
											{group.items.map((item) => (
												<TableRow key={item.id}>
													<TableCell className="truncate">
														{productLabel(productMap.get(item.productId))}
													</TableCell>
													<TableCell className={COL_QUANTITY}>
														<SaleItemQuantityInput
															key={item.quantitySold}
															item={item}
															onCommit={(quantity) =>
																updateSaleItemQuantity(item.id, quantity)
															}
														/>
													</TableCell>
													<TableCell className={COL_UNIT_PRICE}>
														{formatCurrency(item.unitPrice)}
													</TableCell>
													<TableCell className={COL_SUBTOTAL}>
														{formatCurrency(item.unitPrice * item.quantitySold)}
													</TableCell>
													<TableCell className={COL_ACTIONS}>
														<Button
															type="button"
															variant="ghost"
															size="icon-sm"
															onClick={() => removeSale(item.id)}
														>
															<Trash2 className="text-destructive" />
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</CollapsibleContent>
							</Collapsible>
						);
					})
				)}
			</CardContent>
		</Card>
	);
}
