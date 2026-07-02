import { useRbacStore } from "@/stores/rbac-store";
import type { User } from "@/types";

export const userRepository = {
	async list(): Promise<User[]> {
		return useRbacStore.getState().users;
	},
	async assignRole(userId: string, roleId: string): Promise<void> {
		useRbacStore.getState().assignRoleToUser(userId, roleId);
	},
	async setActive(userId: string, active: boolean): Promise<void> {
		useRbacStore.getState().setUserActive(userId, active);
	},
};
