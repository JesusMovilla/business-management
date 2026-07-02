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

/**
 * Selector de rol activo, para probar la app como distintos roles sin backend real de auth.
 * Herramienta temporal de esta fase — desaparecerá cuando haya autenticación real (ver
 * `docs/DECISIONS.md`). Vive en `SidebarFooter`.
 */
export function RoleSwitcher() {
	const roles = useRoles();
	const activeRoleId = useAuthStore((state) => state.activeRoleId);
	const setActiveRole = useAuthStore((state) => state.setActiveRole);

	return (
		<div className="flex flex-col gap-1">
			<span className="text-muted-foreground text-xs">Probando como rol</span>
			<Select
				value={activeRoleId}
				onValueChange={(value) => value && setActiveRole(value)}
			>
				<SelectTrigger size="sm" className="w-full">
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
