import { create } from "zustand";
import { rolesMock } from "@/modules/admin-permisos/mock-data/roles.mock";
import { usersMock } from "@/modules/admin-permisos/mock-data/users.mock";
import type { AppModule, PermissionAction, Role, User } from "@/types";
import { buildEmptyPermissionTree } from "@/types";

interface RbacState {
	roles: Role[];
	users: User[];
	createRole: (input: { name: string; description?: string }) => string;
	updateRole: (
		id: string,
		patch: Partial<Pick<Role, "name" | "description" | "permissions">>,
	) => void;
	deleteRole: (id: string) => void;
	togglePermission: (
		roleId: string,
		module: AppModule,
		action: PermissionAction,
	) => void;
	assignRoleToUser: (userId: string, roleId: string) => void;
	setUserActive: (userId: string, active: boolean) => void;
}

function nowIso() {
	return new Date(2026, 0, 1).toISOString();
}

export const useRbacStore = create<RbacState>((set) => ({
	roles: rolesMock,
	users: usersMock,

	createRole: (input) => {
		const id = `role-${Math.random().toString(36).slice(2, 10)}`;
		const newRole: Role = {
			id,
			name: input.name,
			description: input.description,
			isSystem: false,
			permissions: buildEmptyPermissionTree(),
			createdAt: nowIso(),
			updatedAt: nowIso(),
		};
		set((state) => ({ roles: [...state.roles, newRole] }));
		return id;
	},

	updateRole: (id, patch) => {
		set((state) => ({
			roles: state.roles.map((role) =>
				role.id === id ? { ...role, ...patch, updatedAt: nowIso() } : role,
			),
		}));
	},

	deleteRole: (id) => {
		set((state) => ({
			roles: state.roles.filter((role) => role.id !== id || role.isSystem),
		}));
	},

	togglePermission: (roleId, module, action) => {
		set((state) => ({
			roles: state.roles.map((role) => {
				if (role.id !== roleId) return role;
				const permissions = role.permissions.map((entry) => {
					if (entry.module !== module) return entry;
					const nextValue = !entry.actions[action];
					const actions = { ...entry.actions, [action]: nextValue };
					if (action === "ver" && !nextValue) {
						actions.crear = false;
						actions.editar = false;
						actions.eliminar = false;
					}
					if (action !== "ver" && nextValue) {
						actions.ver = true;
					}
					return { ...entry, actions };
				});
				return { ...role, permissions, updatedAt: nowIso() };
			}),
		}));
	},

	assignRoleToUser: (userId, roleId) => {
		set((state) => ({
			users: state.users.map((user) =>
				user.id === userId ? { ...user, roleId } : user,
			),
		}));
	},

	setUserActive: (userId, active) => {
		set((state) => ({
			users: state.users.map((user) =>
				user.id === userId ? { ...user, active } : user,
			),
		}));
	},
}));
