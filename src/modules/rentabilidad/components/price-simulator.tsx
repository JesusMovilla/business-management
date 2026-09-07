"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { CurrencyInput } from "@/components/forms/currency-input";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatPercent } from "@/lib/format";
import { toast } from "@/lib/toast";
import { updateSimulatedPriceAction } from "../actions";

export interface SimulatorProduct {
	id: string;
	name: string;
	presentation: string;
	cost: number;
	retailPrice: number;
}

/**
 * Simulador de precio (sección 8 del plan): el usuario elige un producto y un precio nuevo, y ve
 * de inmediato el nuevo margen, la ganancia por unidad y cómo cambia frente al precio actual. El
 * cálculo es client-side sobre datos ya cargados; "Guardar precio" es la única acción que persiste
 * algo — actualiza `products.retail_price` vía `updateSimulatedPriceAction` (edición real de
 * Inventario, valida el permiso de ese módulo, no el de Rentabilidad).
 */
export function PriceSimulator({ products }: { products: SimulatorProduct[] }) {
	const router = useRouter();
	const [isSaving, startSaving] = useTransition();
	const [productId, setProductId] = useState<string | undefined>(
		products[0]?.id,
	);
	const [newPrice, setNewPrice] = useState<number | null>(
		products[0]?.retailPrice ?? null,
	);

	const product = useMemo(
		() => products.find((p) => p.id === productId),
		[products, productId],
	);

	if (!product) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Simulador de precio</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-sm">
						No hay productos activos.
					</p>
				</CardContent>
			</Card>
		);
	}

	const currentMarginPercent =
		product.retailPrice > 0
			? ((product.retailPrice - product.cost) / product.retailPrice) * 100
			: null;
	const price = newPrice ?? product.retailPrice;
	const newProfitPerUnit = price - product.cost;
	const newMarginPercent = price > 0 ? (newProfitPerUnit / price) * 100 : null;
	const canSave =
		newPrice !== null && newPrice !== product.retailPrice && !isSaving;

	const handleSave = () => {
		if (newPrice === null) return;
		startSaving(async () => {
			const result = await updateSimulatedPriceAction(product.id, newPrice);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			toast.success(`Precio de ${product.name} actualizado.`);
			router.refresh();
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Simulador de precio</CardTitle>
				<p className="text-muted-foreground text-sm">
					Calcula el efecto de un precio nuevo. Solo se guarda si presionas
					"Guardar precio".
				</p>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<div className="flex flex-wrap items-end gap-3">
					<div className="flex min-w-48 flex-1 flex-col gap-1.5">
						<Label>Producto</Label>
						<Select
							searchable
							value={productId}
							onValueChange={(value) => {
								setProductId(value ?? undefined);
								const selected = products.find((p) => p.id === value);
								setNewPrice(selected?.retailPrice ?? null);
							}}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Selecciona un producto" />
							</SelectTrigger>
							<SelectContent>
								{products.map((p) => (
									<SelectItem key={p.id} value={p.id}>
										{p.name} ({p.presentation})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex w-48 shrink-0 flex-col gap-1.5">
						<Label>Nuevo precio</Label>
						<CurrencyInput value={newPrice} onValueChange={setNewPrice} />
					</div>
					<PermissionGuard module="inventario" action="editar">
						<Button
							type="button"
							variant="outline"
							disabled={!canSave}
							onClick={handleSave}
						>
							<Save className="size-4" />
							{isSaving ? "Guardando..." : "Guardar precio"}
						</Button>
					</PermissionGuard>
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<div className="flex flex-col gap-1 rounded-lg border p-3">
						<span className="text-muted-foreground text-xs">Precio actual</span>
						<span className="font-semibold text-lg tabular-nums">
							{formatCurrency(product.retailPrice)}
						</span>
						<span className="text-muted-foreground text-xs">
							Margen actual:{" "}
							{currentMarginPercent === null
								? "—"
								: formatPercent(currentMarginPercent)}
						</span>
					</div>
					<div className="flex flex-col gap-1 rounded-lg border p-3">
						<span className="text-muted-foreground text-xs">
							Ganancia por unidad al nuevo precio
						</span>
						<span
							className={`font-semibold text-lg tabular-nums ${
								newProfitPerUnit < 0 ? "text-destructive" : ""
							}`}
						>
							{formatCurrency(newProfitPerUnit)}
						</span>
						<span className="text-muted-foreground text-xs">
							Costo actual: {formatCurrency(product.cost)}
						</span>
					</div>
					<div className="flex flex-col gap-1 rounded-lg border p-3">
						<span className="text-muted-foreground text-xs">Nuevo margen</span>
						<span className="font-semibold text-lg tabular-nums">
							{newMarginPercent === null
								? "—"
								: formatPercent(newMarginPercent)}
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
