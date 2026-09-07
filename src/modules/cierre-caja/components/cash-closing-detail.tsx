"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { useIsAdmin } from "@/lib/rbac/use-permission";
import { toast } from "@/lib/toast";
import type { CashClosingWithItems } from "@/types";
import { useCashClosingMutations } from "../hooks/use-cash-closings";
import { getBalanceStatus } from "../lib/balance-status";
import {
	COL_QUANTITY,
	COL_SUBTOTAL,
	COL_UNIT_PRICE,
	groupItemsBySale,
	productLabel,
	summarizeByProduct,
} from "../lib/sale-groups";
import { CashClosingForm } from "./cash-closing-form";
import { CashClosingRevertDialog } from "./cash-closing-revert-dialog";
import { CashClosingStatusBadge } from "./cash-closing-status-badge";

interface CashClosingDetailProps {
	closing: CashClosingWithItems;
	products: ProductWithQuantity[];
	createdByName: string;
	updatedByName?: string;
}

export function CashClosingDetail({
	closing,
	products,
	createdByName,
	updatedByName,
}: CashClosingDetailProps) {
	const router = useRouter();
	const isAdmin = useIsAdmin();
	const { revertCashClosing } = useCashClosingMutations();
	const [isEditing, setIsEditing] = useState(false);
	const [revertDialogOpen, setRevertDialogOpen] = useState(false);
	const [isReverting, setIsReverting] = useState(false);
	const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());
	const isReverted = closing.status === "revertido";

	const productMap = new Map(products.map((product) => [product.id, product]));
	const saleGroups = groupItemsBySale(closing.items, closing.sales);
	const productSummary = summarizeByProduct(closing.items);

	const toggleSale = (key: string) => {
		setExpandedSales((current) => {
			const next = new Set(current);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	};

	const handleConfirmRevert = async (reason: string) => {
		setIsReverting(true);
		try {
			await toast.promise(revertCashClosing(closing.id, reason), {
				loading: "Revirtiendo cierre...",
				success: "Cierre revertido correctamente.",
				error: (err) =>
					err instanceof Error ? err.message : "No se pudo revertir el cierre.",
			});
			setRevertDialogOpen(false);
			router.refresh();
		} catch {
			// El toast ya mostró el error.
		} finally {
			setIsReverting(false);
		}
	};

	if (isEditing) {
		return (
			<CashClosingForm
				products={products}
				closing={closing}
				onSuccess={() => setIsEditing(false)}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Cierre de caja"
				description={closing.date}
				badge={isReverted && <Badge variant="destructive">Revertido</Badge>}
				backHref="/cierre-caja"
				actions={
					isAdmin &&
					!isReverted && (
						<>
							<Button
								type="button"
								variant="outline"
								onClick={() => setRevertDialogOpen(true)}
							>
								Revertir
							</Button>
							<Button type="button" onClick={() => setIsEditing(true)}>
								Editar
							</Button>
						</>
					)
				}
			/>

			{isReverted && (
				<Card className="border-destructive/40">
					<CardContent className="flex flex-col gap-1 pt-6 text-sm">
						<span className="font-medium">
							Revertido{" "}
							{closing.reversedAt && formatDateTime(closing.reversedAt)}
						</span>
						{closing.reversalReason && (
							<span className="text-muted-foreground">
								Motivo: {closing.reversalReason}
							</span>
						)}
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Conciliación</CardTitle>
				</CardHeader>
				<CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
					<Info
						label="Ingreso esperado"
						value={formatCurrency(closing.expectedIncome)}
					/>
					<Info
						label="Dinero real"
						value={formatCurrency(closing.actualCash)}
					/>
					<Info
						label="Diferencia"
						value={
							<div className="flex items-center gap-2">
								<CashClosingStatusBadge
									status={getBalanceStatus(closing.difference)}
								/>
								{closing.difference !== 0 && (
									<span>{formatCurrency(Math.abs(closing.difference))}</span>
								)}
							</div>
						}
					/>
					<Info label="Motivo" value={closing.reason || "—"} />
					<Info
						label="Creado por"
						value={`${createdByName} · ${formatDateTime(closing.createdAt)}`}
					/>
					{updatedByName && (
						<Info
							label="Última edición"
							value={`${updatedByName} · ${formatDateTime(closing.updatedAt)}`}
						/>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Ventas registradas</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					{saleGroups.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							Este cierre no tiene ventas registradas.
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
										<div className="flex flex-col gap-2 sm:hidden">
											{group.items.map((item) => (
												<div key={item.id} className="rounded-md border p-3">
													<div className="truncate text-sm font-medium">
														{productLabel(productMap.get(item.productId))}
													</div>
													<div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2 border-t pt-3">
														<div>
															<div className="text-muted-foreground text-xs">
																Cantidad
															</div>
															<div className="text-sm">{item.quantitySold}</div>
														</div>
														<div>
															<div className="text-muted-foreground text-xs">
																Precio unitario
															</div>
															<div className="text-sm">
																{formatCurrency(item.unitPrice)}
															</div>
														</div>
														<div>
															<div className="text-muted-foreground text-xs">
																Subtotal
															</div>
															<div className="text-sm font-medium">
																{formatCurrency(
																	item.unitPrice * item.quantitySold,
																)}
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
														<TableHead className={COL_QUANTITY}>
															Cantidad
														</TableHead>
														<TableHead className={COL_UNIT_PRICE}>
															Precio unitario
														</TableHead>
														<TableHead className={COL_SUBTOTAL}>
															Subtotal
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{group.items.map((item) => (
														<TableRow key={item.id}>
															<TableCell className="truncate">
																{productLabel(productMap.get(item.productId))}
															</TableCell>
															<TableCell className={COL_QUANTITY}>
																{item.quantitySold}
															</TableCell>
															<TableCell className={COL_UNIT_PRICE}>
																{formatCurrency(item.unitPrice)}
															</TableCell>
															<TableCell className={COL_SUBTOTAL}>
																{formatCurrency(
																	item.unitPrice * item.quantitySold,
																)}
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>
									</CollapsibleContent>
								</Collapsible>
							);
						})
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Detalle por producto</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					{productSummary.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							Este cierre no tiene ventas registradas.
						</p>
					) : (
						<>
							<div className="flex flex-col gap-2 sm:hidden">
								{productSummary.map((summary) => (
									<div
										key={summary.productId}
										className="rounded-md border p-3"
									>
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
				</CardContent>
			</Card>

			<CashClosingRevertDialog
				open={revertDialogOpen}
				onOpenChange={setRevertDialogOpen}
				onConfirm={handleConfirmRevert}
				isPending={isReverting}
			/>
		</div>
	);
}

function Info({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-muted-foreground text-xs">{label}</span>
			<span className="font-medium">{value}</span>
		</div>
	);
}
