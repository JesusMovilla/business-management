"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "@/lib/toast";
import type { User } from "@/types";
import { assignRoleAction, setUserActiveAction } from "../actions";

type UserOptimisticAction =
	| { type: "assignRole"; userId: string; roleId: string }
	| { type: "setActive"; userId: string; active: boolean };

function usersReducer(state: User[], action: UserOptimisticAction): User[] {
	switch (action.type) {
		case "assignRole":
			return state.map((user) =>
				user.id === action.userId ? { ...user, roleId: action.roleId } : user,
			);
		case "setActive":
			return state.map((user) =>
				user.id === action.userId ? { ...user, active: action.active } : user,
			);
	}
}

export function useUsersController(initialUsers: User[]) {
	const [isPending, startTransition] = useTransition();
	const [users, applyOptimistic] = useOptimistic(initialUsers, usersReducer);

	const assignRole = (userId: string, roleId: string) => {
		startTransition(async () => {
			applyOptimistic({ type: "assignRole", userId, roleId });
			const result = await assignRoleAction(userId, roleId);
			if (!result.success) toast.error(result.error);
		});
	};

	const setActive = (userId: string, active: boolean) => {
		startTransition(async () => {
			applyOptimistic({ type: "setActive", userId, active });
			const result = await setUserActiveAction(userId, active);
			if (!result.success) toast.error(result.error);
		});
	};

	return { users, assignRole, setActive, isPending };
}
