import type { AppModule, PermissionAction, Role } from "@/types";

export function can(
	role: Role | undefined,
	module: AppModule,
	action: PermissionAction,
): boolean {
	if (!role) return false;
	const modulePermission = role.permissions.find((p) => p.module === module);
	return modulePermission?.actions[action] ?? false;
}
