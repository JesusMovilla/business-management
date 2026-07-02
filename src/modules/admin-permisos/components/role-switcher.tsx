"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useRoles } from "@/modules/admin-permisos/hooks/use-roles";
import { useAuthStore } from "@/stores/auth-store";

export function RoleSwitcher() {
	const roles = useRoles();
	const activeRoleId = useAuthStore((state) => state.activeRoleId);
	const setActiveRole = useAuthStore((state) => state.setActiveRole);

	return (
		<div className="flex flex-col gap-1">
			<span className="hidden text-muted-foreground text-xs sm:block">
				Probando como rol
			</span>
			<Select
				value={activeRoleId}
				onValueChange={(value) => value && setActiveRole(value)}
			>
				<SelectTrigger size="sm" className="w-[130px] sm:w-[180px]">
					<SelectValue placeholder="Selecciona un rol" />
				</SelectTrigger>
				<SelectContent>
					{roles.map((role) => (
						<SelectItem key={role.id} value={role.id}>
							{role.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
