"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useRbacMutations, useRoles, useUsers } from "../hooks/use-roles";

export function UserTable() {
	const users = useUsers();
	const roles = useRoles();
	const { assignRoleToUser, setUserActive } = useRbacMutations();

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Nombre</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Rol</TableHead>
						<TableHead>Activo</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{users.map((user) => (
						<TableRow key={user.id}>
							<TableCell className="font-medium">{user.fullName}</TableCell>
							<TableCell className="text-muted-foreground">
								{user.email}
							</TableCell>
							<TableCell>
								<Select
									value={user.roleId}
									onValueChange={(value) =>
										assignRoleToUser(user.id, value as string)
									}
								>
									<SelectTrigger size="sm" className="w-[180px]">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{roles.map((role) => (
											<SelectItem key={role.id} value={role.id}>
												{role.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</TableCell>
							<TableCell>
								<Switch
									checked={user.active}
									onCheckedChange={(checked) => setUserActive(user.id, checked)}
								/>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
