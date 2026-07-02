import { create } from "zustand";
import { ROLE_ADMIN_ID } from "@/modules/admin-permisos/mock-data/roles.mock";
import { usersMock } from "@/modules/admin-permisos/mock-data/users.mock";

interface AuthState {
	currentUserId: string;
	activeRoleId: string;
	setCurrentUser: (userId: string) => void;
	setActiveRole: (roleId: string) => void;
}

const defaultUser = usersMock[0];

export const useAuthStore = create<AuthState>((set) => ({
	currentUserId: defaultUser.id,
	activeRoleId: defaultUser.roleId ?? ROLE_ADMIN_ID,
	setCurrentUser: (userId) => set({ currentUserId: userId }),
	setActiveRole: (roleId) => set({ activeRoleId: roleId }),
}));
