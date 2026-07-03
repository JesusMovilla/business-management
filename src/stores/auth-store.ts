import { create } from "zustand";

export interface SessionUser {
	id: string;
	name: string;
	email: string;
	roleId: string;
}

interface AuthState {
	currentUser: SessionUser | null;
	hydrate: (user: SessionUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	currentUser: null,
	hydrate: (user) => set({ currentUser: user }),
}));
