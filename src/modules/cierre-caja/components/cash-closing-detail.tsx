"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { formatCurrency, formatDateTime } from "@/lib/format";
import { useIsAdmin } from "@/lib/rbac/use-permission";
import type { CashClosingWithItems } from "@/types";
import { getBalanceStatus } from "../lib/balance-status";
import { CashClosingForm } from "./cash-closing-form";
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
	const isAdmin = useIsAdmin();
	const [isEditing, setIsEditing] = useState(false);

	const productName = (productId: string) =>
		products.find((product) => product.id === productId)?.name ??
		"Producto eliminado";

	if (isEditing) {
		return (
			<div className="flex flex-col gap-6">
				<div>
					<h1 className="text-2xl font-semibold">Editar cierre de caja</h1>
				</div>
				<CashClosingForm
					mode="edit"
					products={products}
					closing={closing}
					onSuccess={() => setIsEditing(false)}
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">Cierre de caja</h1>
					<p className="text-muted-foreground text-sm">{closing.date}</p>
				</div>
				{isAdmin && (
					<Button type="button" onClick={() => setIsEditing(true)}>
						Editar
					</Button>
				)}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Conciliación</CardTitle>
				</CardHeader>
				<CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
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
					<CardTitle>Productos vendidos</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Producto</TableHead>
								<TableHead>Cantidad</TableHead>
								<TableHead>Precio unitario</TableHead>
								<TableHead>Subtotal</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{closing.items.map((item) => (
								<TableRow key={item.id}>
									<TableCell>{productName(item.productId)}</TableCell>
									<TableCell>{item.quantitySold}</TableCell>
									<TableCell>{formatCurrency(item.unitPrice)}</TableCell>
									<TableCell>
										{formatCurrency(item.unitPrice * item.quantitySold)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
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
