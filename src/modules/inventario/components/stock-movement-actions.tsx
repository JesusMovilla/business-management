"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/lib/rbac/use-permission";
import { StockMovementDialog } from "./stock-movement-dialog";

/**
 * Botones para registrar movimientos manuales de stock desde el detalle de un producto. Reservado
 * al rol Administrador (`useIsAdmin`) sin excepción: el resto de roles registra entradas por
 * compra desde `/inventario/movimientos` (entrada masiva) y ventas desde Cierre de caja cuando
 * ese módulo exista. Ver `docs/RBAC.md` y `docs/MODULES.md`.
 */
export function StockMovementActions({ productId }: { productId: string }) {
	const [openDialog, setOpenDialog] = useState<
		"entrada" | "venta" | "merma" | "ajuste" | null
	>(null);
	const isAdmin = useIsAdmin();

	if (!isAdmin) {
		return (
			<p className="text-muted-foreground text-sm">
				Solo el administrador puede registrar movimientos manuales. Los ingresos
				por compra se registran en{" "}
				<Link
					href="/inventario/movimientos"
					className="text-primary hover:underline"
				>
					Movimientos
				</Link>{" "}
				; las ventas se registran desde Cierre de caja.
			</p>
		);
	}

	return (
		<div className="flex flex-wrap gap-2">
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() => setOpenDialog("entrada")}
			>
				+ Entrada
			</Button>
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() => setOpenDialog("venta")}
			>
				− Venta
			</Button>
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() => setOpenDialog("merma")}
			>
				− Merma
			</Button>
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() => setOpenDialog("ajuste")}
			>
				Ajuste manual
			</Button>

			{openDialog && (
				<StockMovementDialog
					type={openDialog}
					productId={productId}
					open={openDialog !== null}
					onOpenChange={(open) => !open && setOpenDialog(null)}
				/>
			)}
		</div>
	);
}
