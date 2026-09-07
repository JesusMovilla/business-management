"use client";

import type { ReactNode } from "react";
import { useIsAdmin } from "@/lib/rbac/use-permission";

interface AdminOnlyProps {
	children: ReactNode;
	fallback?: ReactNode;
}

/**
 * Muestra u oculta `children` según si el rol activo es el Administrador (`ROLE_ADMIN_ID`), sin
 * redirigir — equivalente de `PermissionGuard`, pero por rol en vez de por la matriz de permisos
 * configurable. Usar para fragmentos de UI reservados al Administrador sin excepción (ver
 * "Caso especial: chequeo de rol fuera de la matriz" en `docs/RBAC.md`), como la tarjeta de
 * "Limpieza de datos" en `/admin`.
 * @param fallback contenido opcional a renderizar si el rol activo no es Administrador (default: nada).
 */
export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
	const isAdmin = useIsAdmin();
	return isAdmin ? children : fallback;
}
