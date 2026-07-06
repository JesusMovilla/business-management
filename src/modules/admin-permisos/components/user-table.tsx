"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { Button } from "@/components/ui/button";
import type { Role, User } from "@/types";
import { useUsersController } from "../hooks/use-users";
import { NewUserDialog } from "./new-user-dialog";
import { buildUserColumns } from "./user-table-columns";

interface UserTableProps {
	initialUsers: User[];
	roles: Role[];
}

export function UserTable({ initialUsers, roles }: UserTableProps) {
	const {
		users,
		pendingRoles,
		setPendingRole,
		hasPendingRoleChanges,
		saveRoleChanges,
		discardRoleChanges,
		setActive,
		isPending,
	} = useUsersController(initialUsers);

	const columns = useMemo(
		() =>
			buildUserColumns({
				roles,
				pendingRoles,
				onRoleChange: setPendingRole,
				onActiveChange: setActive,
				isPending,
			}),
		[roles, pendingRoles, setPendingRole, setActive, isPending],
	);

	return (
		<DataTable
			columns={columns}
			data={users}
			searchPlaceholder="Buscar por nombre o email..."
			emptyMessage="No hay usuarios."
			toolbarActions={
				<>
					{hasPendingRoleChanges && (
						<>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={discardRoleChanges}
								disabled={isPending}
							>
								Descartar
							</Button>
							<Button
								type="button"
								size="sm"
								onClick={saveRoleChanges}
								disabled={isPending}
							>
								Guardar cambios
							</Button>
						</>
					)}
					<PermissionGuard module="admin" action="crear">
						<NewUserDialog roles={roles} />
					</PermissionGuard>
				</>
			}
		/>
	);
}
