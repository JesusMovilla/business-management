"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useRbacStore } from "@/stores/rbac-store";
import type { AppModule, PermissionAction } from "@/types";
import { can } from "./can";
import { ROLE_ADMIN_ID } from "./constants";

export function useActiveRole() {
	const currentUser = useAuthStore((state) => state.currentUser);
	return useRbacStore((state) =>
		state.roles.find((role) => role.id === currentUser?.roleId),
	);
}

export function usePermission(
	module: AppModule,
	action: PermissionAction,
): boolean {
	const activeRole = useActiveRole();
	return can(activeRole, module, action);
}

/**
 * Chequeo de rol específico (no de la matriz de permisos) para operaciones reservadas al
 * Administrador sin excepción, como el ajuste manual de stock. Ver `docs/RBAC.md`.
 */
export function useIsAdmin(): boolean {
	const activeRole = useActiveRole();
	return activeRole?.id === ROLE_ADMIN_ID;
}
