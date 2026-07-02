"use client";

import { ROLE_ADMIN_ID } from "@/modules/admin-permisos/mock-data/roles.mock";
import { useAuthStore } from "@/stores/auth-store";
import { useRbacStore } from "@/stores/rbac-store";
import type { AppModule, PermissionAction } from "@/types";
import { can } from "./can";

export function useActiveRole() {
	const activeRoleId = useAuthStore((state) => state.activeRoleId);
	return useRbacStore((state) =>
		state.roles.find((role) => role.id === activeRoleId),
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
