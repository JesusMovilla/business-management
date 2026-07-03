"use client";

import { useCallback, useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { toast } from "@/lib/toast";
import type { Role, User } from "@/types";
import { useUsersController } from "../hooks/use-users";
import { NewUserDialog } from "./new-user-dialog";
import { buildUserColumns } from "./user-table-columns";

interface UserTableProps {
	initialUsers: User[];
	roles: Role[];
}

export function UserTable({ initialUsers, roles }: UserTableProps) {
	const { users, assignRole, setActive } = useUsersController(initialUsers);

	const handleRoleChange = useCallback(
		(userId: string, roleId: string) => {
			assignRole(userId, roleId);
			toast.success("Rol actualizado.");
		},
		[assignRole],
	);

	const handleActiveChange = useCallback(
		(userId: string, active: boolean) => {
			setActive(userId, active);
			toast.success(active ? "Usuario activado." : "Usuario desactivado.");
		},
		[setActive],
	);

	const columns = useMemo(
		() =>
			buildUserColumns({
				roles,
				onRoleChange: handleRoleChange,
				onActiveChange: handleActiveChange,
			}),
		[roles, handleRoleChange, handleActiveChange],
	);

	return (
		<DataTable
			columns={columns}
			data={users}
			searchPlaceholder="Buscar por nombre o email..."
			emptyMessage="No hay usuarios."
			toolbarActions={
				<PermissionGuard module="admin" action="crear">
					<NewUserDialog roles={roles} />
				</PermissionGuard>
			}
		/>
	);
}
