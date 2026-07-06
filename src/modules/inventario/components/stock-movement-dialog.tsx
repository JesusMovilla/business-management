"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
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
import { Switch } from "@/components/ui/switch";
import { toast } from "@/lib/toast";
import { MERMA_REASONS, type MermaReason } from "@/types";
import { useStockMovementMutations } from "../hooks/use-stock-movements";

const MERMA_REASON_LABELS: Record<MermaReason, string> = {
	vencimiento: "Vencimiento",
	rotura: "Rotura",
	derrame: "Derrame",
	otro: "Otro",
};

type MovementDialogType = "entrada" | "venta" | "merma" | "ajuste";

const DIALOG_TITLES: Record<MovementDialogType, string> = {
	entrada: "Registrar entrada",
	venta: "Registrar venta",
	merma: "Registrar merma",
	ajuste: "Ajuste manual de stock",
};

interface StockMovementDialogProps {
	type: MovementDialogType;
	productId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * Diálogo para registrar un movimiento de inventario, parametrizado por `type`. Ver
 * `docs/DECISIONS.md` para el diseño del ledger de movimientos.
 */
export function StockMovementDialog({
	type,
	productId,
	open,
	onOpenChange,
}: StockMovementDialogProps) {
	const [quantity, setQuantity] = useState("");
	const [reason, setReason] = useState<MermaReason | "">("");
	const [note, setNote] = useState("");
	const [isAddition, setIsAddition] = useState(true);
	const { registerEntrada, registerVenta, registerMerma, registerAjuste } =
		useStockMovementMutations();

	const reset = () => {
		setQuantity("");
		setReason("");
		setNote("");
		setIsAddition(true);
	};

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) reset();
		onOpenChange(nextOpen);
	};

	const handleSubmit = async () => {
		const parsedQuantity = Number(quantity);
		if (!parsedQuantity || parsedQuantity <= 0) return;

		let ok = false;
		if (type === "entrada") {
			ok = await registerEntrada(productId, parsedQuantity, note || undefined);
			if (ok) toast.success("Entrada registrada correctamente.");
		} else if (type === "venta") {
			ok = await registerVenta(productId, parsedQuantity, note || undefined);
			if (ok) toast.success("Venta registrada correctamente.");
		} else if (type === "merma") {
			if (!reason) return;
			ok = await registerMerma(
				productId,
				parsedQuantity,
				reason,
				note || undefined,
			);
			if (ok) toast.success("Merma registrada correctamente.");
		} else {
			if (!note.trim()) return;
			ok = await registerAjuste(
				productId,
				isAddition ? parsedQuantity : -parsedQuantity,
				note,
			);
			if (ok) toast.success("Ajuste registrado correctamente.");
		}
		if (ok) handleOpenChange(false);
	};

	const isValid =
		Number(quantity) > 0 &&
		(type !== "merma" || reason !== "") &&
		(type !== "ajuste" || note.trim() !== "");

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{DIALOG_TITLES[type]}</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					{type === "ajuste" && (
						<div className="flex items-center gap-2">
							<Switch checked={isAddition} onCheckedChange={setIsAddition} />
							<Label>
								{isAddition ? "Sumar al stock" : "Restar del stock"}
							</Label>
						</div>
					)}
					<div className="flex flex-col gap-2">
						<Label htmlFor="movement-quantity">Cantidad</Label>
						<Input
							id="movement-quantity"
							type="number"
							min={1}
							value={quantity}
							onChange={(event) => setQuantity(event.target.value)}
						/>
					</div>
					{type === "merma" && (
						<div className="flex flex-col gap-2">
							<Label>Motivo</Label>
							<Select
								value={reason}
								onValueChange={(value) => setReason(value as MermaReason)}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Selecciona un motivo" />
								</SelectTrigger>
								<SelectContent>
									{MERMA_REASONS.map((mermaReason) => (
										<SelectItem key={mermaReason} value={mermaReason}>
											{MERMA_REASON_LABELS[mermaReason]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
					<div className="flex flex-col gap-2">
						<Label htmlFor="movement-note">
							Nota{type === "ajuste" ? "" : " (opcional)"}
						</Label>
						<Input
							id="movement-note"
							value={note}
							onChange={(event) => setNote(event.target.value)}
							placeholder={
								type === "ajuste"
									? "Ej. Corrección tras conteo físico"
									: "Ej. Reabastecimiento semanal"
							}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button type="button" onClick={handleSubmit} disabled={!isValid}>
						Registrar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
