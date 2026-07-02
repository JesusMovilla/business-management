"use client";

import { useRbacStore } from "@/stores/rbac-store";

export function useRoles() {
	return useRbacStore((state) => state.roles);
}

export function useRole(id: string) {
	return useRbacStore((state) => state.roles.find((role) => role.id === id));
}

export function useUsers() {
	return useRbacStore((state) => state.users);
}

export function useRbacMutations() {
	const createRole = useRbacStore((state) => state.createRole);
	const updateRole = useRbacStore((state) => state.updateRole);
	const deleteRole = useRbacStore((state) => state.deleteRole);
	const togglePermission = useRbacStore((state) => state.togglePermission);
	const assignRoleToUser = useRbacStore((state) => state.assignRoleToUser);
	const setUserActive = useRbacStore((state) => state.setUserActive);
	return {
		createRole,
		updateRole,
		deleteRole,
		togglePermission,
		assignRoleToUser,
		setUserActive,
	};
}
