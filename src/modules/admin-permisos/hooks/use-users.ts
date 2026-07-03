"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { toast } from "@/lib/toast";
import type { User } from "@/types";
import { assignRolesBatchAction, setUserActiveAction } from "../actions";

type UserOptimisticAction = {
	type: "setActive";
	userId: string;
	active: boolean;
};

function usersReducer(state: User[], action: UserOptimisticAction): User[] {
	return state.map((user) =>
		user.id === action.userId ? { ...user, active: action.active } : user,
	);
}

/**
 * El cambio de "activo" se guarda al instante (optimista). El cambio de rol, en cambio, se
 * junta en `pendingRoles` y solo se persiste al llamar `saveRoleChanges` — así una reasignación
 * masiva dispara una sola transacción en vez de una mutación por usuario (ver docs/RBAC.md).
 */
export function useUsersController(initialUsers: User[]) {
	const [isPending, startTransition] = useTransition();
	const [users, applyOptimistic] = useOptimistic(initialUsers, usersReducer);
	const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});

	const setActive = (userId: string, active: boolean) => {
		startTransition(async () => {
			applyOptimistic({ type: "setActive", userId, active });
			const result = await setUserActiveAction(userId, active);
			if (!result.success) toast.error(result.error);
		});
	};

	const setPendingRole = (userId: string, roleId: string) => {
		const original = initialUsers.find((u) => u.id === userId)?.roleId;
		setPendingRoles((prev) => {
			const next = { ...prev };
			if (roleId === original) delete next[userId];
			else next[userId] = roleId;
			return next;
		});
	};

	const discardRoleChanges = () => setPendingRoles({});

	const hasPendingRoleChanges = Object.keys(pendingRoles).length > 0;

	const saveRoleChanges = () => {
		if (!hasPendingRoleChanges) return;
		const assignments = Object.entries(pendingRoles).map(
			([userId, roleId]) => ({
				userId,
				roleId,
			}),
		);
		startTransition(async () => {
			const result = await assignRolesBatchAction(assignments);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			toast.success("Roles actualizados.");
			setPendingRoles({});
		});
	};

	const usersWithPendingRoles = useMemo(
		() =>
			users.map((user) =>
				pendingRoles[user.id]
					? { ...user, roleId: pendingRoles[user.id] }
					: user,
			),
		[users, pendingRoles],
	);

	return {
		users: usersWithPendingRoles,
		setActive,
		pendingRoles,
		setPendingRole,
		hasPendingRoleChanges,
		saveRoleChanges,
		discardRoleChanges,
		isPending,
	};
}
