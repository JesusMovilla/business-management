"use client";

import { type ReactNode, useEffect } from "react";
import { type SessionUser, useAuthStore } from "@/stores/auth-store";
import { useRbacStore } from "@/stores/rbac-store";
import type { Role } from "@/types";

interface RbacHydratorProps {
	user: SessionUser;
	roles: Role[];
	children: ReactNode;
}

/**
 * Sincroniza el usuario/rol de la sesión real (obtenidos server-side en `(app)/layout.tsx`) hacia
 * los stores de Zustand que `usePermission`/`useIsAdmin`/`SidebarFooter` ya consumen — así esos
 * hooks no cambian, solo de dónde sale el dato (antes mocks, ahora la sesión + la DB).
 */
export function RbacHydrator({ user, roles, children }: RbacHydratorProps) {
	useEffect(() => {
		useAuthStore.getState().hydrate(user);
		useRbacStore.getState().hydrateRoles(roles);
	}, [user, roles]);

	return <>{children}</>;
}
