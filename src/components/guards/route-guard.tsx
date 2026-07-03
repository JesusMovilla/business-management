"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { usePermission } from "@/lib/rbac/use-permission";
import { useAuthStore } from "@/stores/auth-store";
import type { AppModule, PermissionAction } from "@/types";

interface RouteGuardProps {
	module: AppModule;
	action: PermissionAction;
	redirectTo?: string;
	children: ReactNode;
}

/**
 * Bloquea toda la página según permiso de `module`/`action` y redirige a `redirectTo` si no hay acceso.
 * Espera a que `RbacHydrator` (un ancestro) hidrate `auth-store` antes de evaluar el permiso: los
 * efectos de React se disparan de hijo a padre, así que en el primer render `currentUser` todavía
 * es `null` — sin este chequeo, `allowed` sale en `false` un instante y redirige de más.
 */
export function RouteGuard({
	module,
	action,
	redirectTo = "/acceso-denegado",
	children,
}: RouteGuardProps) {
	const hydrated = useAuthStore((state) => state.currentUser !== null);
	const allowed = usePermission(module, action);
	const router = useRouter();

	useEffect(() => {
		if (hydrated && !allowed) {
			router.replace(redirectTo);
		}
	}, [hydrated, allowed, redirectTo, router]);

	if (!hydrated || !allowed) return null;
	return <>{children}</>;
}
