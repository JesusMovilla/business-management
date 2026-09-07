"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useIsAdmin } from "@/lib/rbac/use-permission";
import { useAuthStore } from "@/stores/auth-store";

interface AdminRouteGuardProps {
	redirectTo?: string;
	children: ReactNode;
}

/**
 * Bloquea toda la página a menos que el rol activo sea el Administrador (`ROLE_ADMIN_ID`),
 * redirigiendo a `redirectTo` en caso contrario — equivalente de `RouteGuard`, pero por rol en vez
 * de por la matriz de permisos configurable. Usar solo para secciones reservadas al Administrador
 * sin excepción (ver "Caso especial: chequeo de rol fuera de la matriz" en `docs/RBAC.md`), como
 * `/admin/limpieza`. Mismo cuidado que `RouteGuard` con la hidratación de `auth-store`: espera a
 * que `currentUser` deje de ser `null` antes de evaluar, para no redirigir de más en el primer
 * render.
 */
export function AdminRouteGuard({
	redirectTo = "/acceso-denegado",
	children,
}: AdminRouteGuardProps) {
	const hydrated = useAuthStore((state) => state.currentUser !== null);
	const isAdmin = useIsAdmin();
	const router = useRouter();

	useEffect(() => {
		if (hydrated && !isAdmin) {
			router.replace(redirectTo);
		}
	}, [hydrated, isAdmin, redirectTo, router]);

	if (!hydrated || !isAdmin) return null;
	return <>{children}</>;
}
