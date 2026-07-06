"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { useProducts } from "../hooks/use-products";
import { useStockMovementMutations } from "../hooks/use-stock-movements";
import { QuickProductDialog } from "./quick-product-dialog";

interface EntradaRow {
	rowId: string;
	productId: string;
	quantity: string;
}

function emptyRow(): EntradaRow {
	return {
		rowId: `row-${Math.random().toString(36).slice(2, 10)}`,
		productId: "",
		quantity: "",
	};
}

/**
 * Diálogo para registrar entradas de varios productos a la vez (ej. una compra con varias
 * líneas). Cada línea se registra como un movimiento `entrada` independiente en el producto
 * correspondiente, todos con la misma nota — la trazabilidad queda igual que un registro manual,
 * solo que en un solo paso. Requiere permiso `inventario.crear`. Ver `docs/MODULES.md`.
 */
export function BulkEntradaDialog() {
	const [open, setOpen] = useState(false);
	const [rows, setRows] = useState<EntradaRow[]>([emptyRow()]);
	const [note, setNote] = useState("");
	const products = useProducts();
	const { registerEntrada } = useStockMovementMutations();

	const reset = () => {
		setRows([emptyRow()]);
		setNote("");
	};

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) reset();
		setOpen(nextOpen);
	};

	const updateRow = (rowId: string, patch: Partial<EntradaRow>) => {
		setRows((current) =>
			current.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row)),
		);
	};

	const removeRow = (rowId: string) => {
		setRows((current) => current.filter((row) => row.rowId !== rowId));
	};

	const addRow = () => {
		setRows((current) => [...current, emptyRow()]);
	};

	const validRows = rows.filter(
		(row) => row.productId && Number(row.quantity) > 0,
	);
	const isValid = validRows.length > 0;

	const handleSubmit = () => {
		if (!isValid) return;
		for (const row of validRows) {
			registerEntrada(row.productId, Number(row.quantity), note || undefined);
		}
		toast.success(
			validRows.length === 1
				? "Entrada registrada correctamente."
				: `${validRows.length} entradas registradas correctamente.`,
		);
		handleOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger render={<Button type="button" />}>
				+ Registrar entrada
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Registrar entrada de productos</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-3">
					{rows.map((row) => {
						const selectedElsewhere = rows.reduce<Set<string>>((acc, other) => {
							if (other.rowId !== row.rowId) acc.add(other.productId);
							return acc;
						}, new Set());
						const availableProducts = products.filter(
							(product) =>
								product.id === row.productId ||
								!selectedElsewhere.has(product.id),
						);
						return (
							<div key={row.rowId} className="flex items-end gap-2">
								<div className="flex flex-1 flex-col gap-2">
									<Label>Producto</Label>
									<Select
										value={row.productId}
										onValueChange={(value) =>
											updateRow(row.rowId, { productId: value ?? "" })
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Selecciona un producto" />
										</SelectTrigger>
										<SelectContent>
											{availableProducts.map((product) => (
												<SelectItem key={product.id} value={product.id}>
													{product.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="flex w-24 flex-col gap-2">
									<Label>Cantidad</Label>
									<Input
										type="number"
										min={1}
										value={row.quantity}
										onChange={(event) =>
											updateRow(row.rowId, { quantity: event.target.value })
										}
									/>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									onClick={() => removeRow(row.rowId)}
									disabled={rows.length === 1}
								>
									<Trash2 className="text-destructive" />
								</Button>
							</div>
						);
					})}
					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={addRow}
							disabled={rows.length >= products.length}
						>
							+ Agregar producto
						</Button>
						<QuickProductDialog
							onCreated={(productId) =>
								setRows((current) => [...current, { ...emptyRow(), productId }])
							}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="bulk-entrada-note">Nota (opcional)</Label>
						<Input
							id="bulk-entrada-note"
							value={note}
							onChange={(event) => setNote(event.target.value)}
							placeholder="Ej. Compra proveedor Bavaria S.A."
						/>
					</div>
				</div>
				<DialogFooter>
					<Button type="button" onClick={handleSubmit} disabled={!isValid}>
						Registrar entradas
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
