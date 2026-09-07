"use server";

import { revalidatePath } from "next/cache";
import { productRepository } from "@/data/repositories/product-repository";
import { toActionErrorMessage } from "@/lib/action-error";
import { checkPermission } from "@/lib/rbac/require-permission";

export type RentabilidadActionResult =
	| { success: true }
	| { success: false; error: string };

/**
 * Guarda el precio simulado en `PriceSimulator` como el precio de lista real del producto — es en
 * el fondo una edición de Inventario (`products.retail_price`), así que se valida contra el
 * permiso de "editar" de Inventario, no de Rentabilidad (que es un módulo de solo lectura). No
 * toca `cost` ni ningún otro campo del producto.
 */
export async function updateSimulatedPriceAction(
	productId: string,
	newPrice: number,
): Promise<RentabilidadActionResult> {
	const authz = await checkPermission("inventario", "editar");
	if (authz) return { success: false, error: authz.error };

	if (!Number.isFinite(newPrice) || newPrice < 0) {
		return { success: false, error: "El precio debe ser un número válido." };
	}

	try {
		await productRepository.update(productId, {
			pricing: { retailPrice: newPrice },
		});
	} catch (err) {
		return {
			success: false,
			error: toActionErrorMessage(err, {
				fallback: "No se pudo guardar el nuevo precio.",
			}),
		};
	}

	revalidatePath("/rentabilidad");
	revalidatePath("/inventario", "layout");
	return { success: true };
}
