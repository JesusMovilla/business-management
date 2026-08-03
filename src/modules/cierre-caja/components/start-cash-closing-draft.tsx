"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/lib/toast";
import { startCashClosingDraft } from "../hooks/use-cash-closings";

/** CTA para abrir el cierre de caja del día cuando no hay ningún borrador en curso todavía. */
export function StartCashClosingDraft() {
	const router = useRouter();
	const [isStarting, setIsStarting] = useState(false);

	const handleStart = async () => {
		setIsStarting(true);
		try {
			await toast.promise(startCashClosingDraft(), {
				loading: "Iniciando cierre...",
				success: "Cierre iniciado — registra las ventas del día.",
				error: (err) =>
					err instanceof Error ? err.message : "No se pudo iniciar el cierre.",
			});
			router.refresh();
		} catch {
			// El toast ya mostró el error.
		} finally {
			setIsStarting(false);
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Nuevo cierre de caja"
				description="Registra cada venta a medida que ocurre durante el día."
				backHref="/cierre-caja"
			/>
			<Card>
				<CardContent className="flex flex-col items-start gap-4 pt-6">
					<p className="text-muted-foreground text-sm">
						No hay ningún cierre en curso. Inícialo para empezar a registrar las
						ventas del día una por una.
					</p>
					<Button type="button" onClick={handleStart} disabled={isStarting}>
						Iniciar cierre
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
