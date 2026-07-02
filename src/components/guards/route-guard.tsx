"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { usePermission } from "@/lib/rbac/use-permission";
import type { AppModule, PermissionAction } from "@/types";

interface RouteGuardProps {
	module: AppModule;
	action: PermissionAction;
	redirectTo?: string;
	children: ReactNode;
}

/**
 * Bloquea toda la página según permiso de `module`/`action` y redirige a `redirectTo` si no hay acceso.
 */
export function RouteGuard({
	module,
	action,
	redirectTo = "/acceso-denegado",
	children,
}: RouteGuardProps) {
	const allowed = usePermission(module, action);
	const router = useRouter();

	useEffect(() => {
		if (!allowed) {
			router.replace(redirectTo);
		}
	}, [allowed, redirectTo, router]);

	if (!allowed) return null;
	return <>{children}</>;
}
