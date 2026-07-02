"use client";

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
