import { resetInventoryStockAction } from "../actions";

async function resetInventoryStock(reason: string): Promise<number> {
	const result = await resetInventoryStockAction(reason);
	if (!result.success) {
		throw new Error(result.error);
	}
	return result.affected;
}

/**
 * Envuelve las Server Actions de la sección "Limpieza de datos" (exclusiva Admin). Sin estado
 * optimista: cada acción es un evento puntual y poco frecuente — el componente que llama a estos
 * métodos es responsable de `toast.promise` y de refrescar la página tras el éxito, mismo patrón
 * que `useCashClosingMutations`.
 */
export function useMaintenanceMutations() {
	return { resetInventoryStock };
}
