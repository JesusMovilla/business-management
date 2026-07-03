"use client";

import { useCallback, useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { toast } from "@/lib/toast";
import type { Role, User } from "@/types";
import { useRolesListController } from "../hooks/use-roles";
import { buildRoleColumns } from "./role-table-columns";

interface RoleTableProps {
	initialRoles: Role[];
	users: User[];
}

export function RoleTable({ initialRoles, users }: RoleTableProps) {
	const { roles, deleteRole } = useRolesListController(initialRoles);

	const userCountByRole = useMemo(() => {
		const counts: Record<string, number> = {};
		for (const user of users) {
			counts[user.roleId] = (counts[user.roleId] ?? 0) + 1;
		}
		return counts;
	}, [users]);

	const handleDelete = useCallback(
		(roleId: string) => {
			deleteRole(roleId);
			toast.success("Rol eliminado.");
		},
		[deleteRole],
	);

	const columns = useMemo(
		() => buildRoleColumns({ userCountByRole, onDelete: handleDelete }),
		[userCountByRole, handleDelete],
	);

	return (
		<DataTable
			columns={columns}
			data={roles}
			searchPlaceholder="Buscar rol..."
			emptyMessage="No hay roles."
		/>
	);
}
