"use client";

import type { ReactNode } from "react";
import { usePermission } from "@/lib/rbac/use-permission";
import type { AppModule, PermissionAction } from "@/types";

interface PermissionGuardProps {
	module: AppModule;
	action: PermissionAction;
	children: ReactNode;
	fallback?: ReactNode;
}

export function PermissionGuard({
	module,
	action,
	children,
	fallback = null,
}: PermissionGuardProps) {
	const allowed = usePermission(module, action);
	return allowed ? children : fallback;
}
