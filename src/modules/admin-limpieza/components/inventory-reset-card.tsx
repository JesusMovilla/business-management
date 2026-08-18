"use client";

import { PackageX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { toast } from "@/lib/toast";
import { useMaintenanceMutations } from "../hooks/use-maintenance";
import { InventoryResetDialog } from "./inventory-reset-dialog";

interface InventoryResetCardProps {
	/** Cantidad de productos con stock distinto de cero al momento de cargar la página. */
	affectedCount: number;
}

/**
 * Tarjeta "Limpiar inventario" de `/admin/limpieza`. Lleva la cantidad de todos los productos a 0
 * (movimientos `ajuste` compensatorios, ver `resetInventoryStockAction`). Solo el rol
 * Administrador llega a esta página (`AdminRouteGuard` en el layout de la ruta).
 */
export function InventoryResetCard({ affectedCount }: InventoryResetCardProps) {
	const router = useRouter();
	const { resetInventoryStock } = useMaintenanceMutations();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [isPending, setIsPending] = useState(false);

	const handleConfirm = async (reason: string) => {
		setIsPending(true);
		try {
			await toast.promise(resetInventoryStock(reason), {
				loading: "Limpiando inventario...",
				success: "Inventario limpiado correctamente.",
				error: (err) =>
					err instanceof Error
						? err.message
						: "No se pudo limpiar el inventario.",
			});
			setDialogOpen(false);
			router.refresh();
		} catch {
			// El toast ya mostró el error.
		} finally {
			setIsPending(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<PackageX className="size-4" />
					Limpiar inventario
				</CardTitle>
				<CardDescription>
					Lleva la cantidad de todos los productos a 0. No borra productos,
					categorías ni el historial de movimientos — registra un ajuste por
					cada producto con stock.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button
					type="button"
					variant="destructive"
					onClick={() => setDialogOpen(true)}
				>
					Limpiar inventario
				</Button>
			</CardContent>
			<InventoryResetDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onConfirm={handleConfirm}
				affectedCount={affectedCount}
				isPending={isPending}
			/>
		</Card>
	);
}
