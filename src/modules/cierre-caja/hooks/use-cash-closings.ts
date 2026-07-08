"use client";

import { createCashClosingAction, updateCashClosingAction } from "../actions";

export interface CashClosingPayload {
	items: { productId: string; quantitySold: number }[];
	actualCash: number;
	reason?: string;
}

function assertSuccess(
	result: { success: true } | { success: false; error: string },
	fallback: string,
): void {
	if (!result.success) throw new Error(result.error || fallback);
}

/**
 * Envuelve las Server Actions de Cierre de caja. No hay estado optimista que mantener (a
 * diferencia de Inventario/Contactos): crear navega a otra página al terminar y editar es un
 * formulario de un solo registro que simplemente refresca — el componente que llama a estos
 * métodos es responsable de `toast.promise` y de la navegación/callback tras el éxito.
 */
export function useCashClosingMutations() {
	const createCashClosing = async (
		payload: CashClosingPayload,
	): Promise<string> => {
		const result = await createCashClosingAction(payload);
		assertSuccess(result, "No se pudo registrar el cierre.");
		if (!result.id) throw new Error("No se pudo registrar el cierre.");
		return result.id;
	};

	const updateCashClosing = async (
		id: string,
		payload: CashClosingPayload,
	): Promise<void> => {
		const result = await updateCashClosingAction({ id, ...payload });
		assertSuccess(result, "No se pudo actualizar el cierre.");
	};

	return { createCashClosing, updateCashClosing };
}
