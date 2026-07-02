import { useRbacStore } from "@/stores/rbac-store";
import type { AppModule, PermissionAction, Role } from "@/types";

export const roleRepository = {
	async list(): Promise<Role[]> {
		return useRbacStore.getState().roles;
	},
	async create(input: { name: string; description?: string }): Promise<string> {
		return useRbacStore.getState().createRole(input);
	},
	async update(
		id: string,
		patch: Partial<Pick<Role, "name" | "description" | "permissions">>,
	): Promise<void> {
		useRbacStore.getState().updateRole(id, patch);
	},
	async remove(id: string): Promise<void> {
		useRbacStore.getState().deleteRole(id);
	},
	async togglePermission(
		roleId: string,
		module: AppModule,
		action: PermissionAction,
	): Promise<void> {
		useRbacStore.getState().togglePermission(roleId, module, action);
	},
};
