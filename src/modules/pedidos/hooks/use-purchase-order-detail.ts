"use client";

import { revertPurchaseOrderAction } from "../actions";

function assertSuccess(
	result: { success: true } | { success: false; error: string },
	fallback: string,
): void {
	if (!result.success) throw new Error(result.error || fallback);
}

async function revertPurchaseOrder(id: string, reason: string): Promise<void> {
	const result = await revertPurchaseOrderAction(id, reason);
	assertSuccess(result, "No se pudo revertir el pedido.");
}

/**
 * Envuelve las Server Actions de la vista de detalle de un pedido. No hay estado optimista que
 * mantener (mismo criterio que `useCashClosingMutations`): el componente que llama a estos
 * métodos es responsable de `toast.promise` y de `router.refresh()` tras el éxito.
 */
export function usePurchaseOrderDetailMutations() {
	return { revertPurchaseOrder };
}
