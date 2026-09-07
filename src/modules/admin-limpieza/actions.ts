"use server";

import { revalidatePath } from "next/cache";
import { productRepository } from "@/data/repositories/product-repository";
import { toActionErrorMessage } from "@/lib/action-error";
import { getCurrentSession } from "@/lib/auth/session";
import { checkAdmin } from "@/lib/rbac/require-permission";

export type MaintenanceActionResult =
	| { success: true; affected: number }
	| { success: false; error: string };

/**
 * Lleva la cantidad de todos los productos a 0 (`productRepository.resetAllStockToZero`) —
 * reservada al rol Administrador sin excepción (`checkAdmin`), igual que revertir un cierre de
 * caja: es una operación destructiva a nivel de negocio, no una acción de la matriz de permisos
 * configurable. Ver "Caso especial: chequeo de rol fuera de la matriz" en `docs/RBAC.md`.
 */
export async function resetInventoryStockAction(
	reason: string,
): Promise<MaintenanceActionResult> {
	const authz = await checkAdmin();
	if (authz) return { success: false, error: authz.error };

	if (!reason.trim()) {
		return { success: false, error: "Indica un motivo para la limpieza." };
	}

	const session = await getCurrentSession();
	if (!session?.user) return { success: false, error: "No autenticado." };

	try {
		const { affected } = await productRepository.resetAllStockToZero(
			reason.trim(),
			session.user.id,
		);
		revalidatePath("/inventario", "layout");
		revalidatePath("/admin/limpieza");
		return { success: true, affected };
	} catch (err) {
		return {
			success: false,
			error: toActionErrorMessage(err, {
				fallback: "No se pudo limpiar el inventario.",
			}),
		};
	}
}
