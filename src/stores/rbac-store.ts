import { create } from "zustand";
import type { Role } from "@/types";

interface RbacState {
	roles: Role[];
	hydrateRoles: (roles: Role[]) => void;
}

export const useRbacStore = create<RbacState>((set) => ({
	roles: [],
	hydrateRoles: (roles) => set({ roles }),
}));
