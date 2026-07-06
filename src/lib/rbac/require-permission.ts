import "server-only";
import { roleRepository } from "@/data/repositories/role-repository";
import { getCurrentSession } from "@/lib/auth/session";
import type { AppModule, PermissionAction } from "@/types";
import { can } from "./can";
import { ROLE_ADMIN_ID } from "./constants";

class AuthzError extends Error {}

/**
 * Verificación de permisos del lado servidor para usar al inicio de toda Server Action mutable.
 * Complementa (no reemplaza) `usePermission`/`PermissionGuard` del cliente, que solo ocultan UI.
 */
async function requirePermission(module: AppModule, action: PermissionAction) {
	const session = await getCurrentSession();
	if (!session?.user) {
		throw new AuthzError("No autenticado.");
	}

	const roles = await roleRepository.list();
	const role = roles.find((r) => r.id === session.user.roleId);
	if (!can(role, module, action)) {
		throw new AuthzError("No tienes permiso para esta acción.");
	}

	return { session, role };
}

/**
 * Variante de `requirePermission` para el inicio de Server Actions: en vez de lanzar, devuelve
 * `{ error }` para que el caller lo mapee directo al `ActionResult` que ya devuelve (mismo shape
 * que un error de validación zod). `null` significa "permiso concedido, seguir".
 */
export async function checkPermission(
	module: AppModule,
	action: PermissionAction,
): Promise<{ error: string } | null> {
	try {
		await requirePermission(module, action);
		return null;
	} catch (error) {
		if (error instanceof AuthzError) {
			return { error: error.message };
		}
		throw error;
	}
}

/**
 * Chequeo server-side para operaciones reservadas al rol Administrador sin excepción, como los
 * movimientos manuales de stock (`StockMovementActions`/`useIsAdmin` en el cliente). Mismo shape
 * que `checkPermission`, pero no depende de la matriz de permisos. Ver `docs/RBAC.md`.
 */
export async function checkAdmin(): Promise<{ error: string } | null> {
	const session = await getCurrentSession();
	if (!session?.user) {
		return { error: "No autenticado." };
	}
	if (session.user.roleId !== ROLE_ADMIN_ID) {
		return { error: "Solo el administrador puede registrar este movimiento." };
	}
	return null;
}
