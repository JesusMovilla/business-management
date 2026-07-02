"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRoles } from "@/modules/admin-permisos/hooks/use-roles";
import { useAuthStore } from "@/stores/auth-store";
import { useRbacStore } from "@/stores/rbac-store";

/**
 * Pie del menú de navegación: selector de tema y datos del usuario logueado (avatar, nombre,
 * rol activo). Compartido por `AppSidebar` (desktop) y `MobileNav`, para que ambos muestren la
 * misma información en vez de solo el desktop.
 */
export function SidebarFooter() {
	const currentUserId = useAuthStore((state) => state.currentUserId);
	const activeRoleId = useAuthStore((state) => state.activeRoleId);
	const users = useRbacStore((state) => state.users);
	const roles = useRoles();

	const currentUser = users.find((user) => user.id === currentUserId);
	const activeRole = roles.find((role) => role.id === activeRoleId);
	const initials = currentUser?.fullName
		.split(" ")
		.map((part) => part[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();

	return (
		<div className="mt-auto border-t">
			<div className="flex items-center justify-between gap-2 px-4 py-2.5">
				<span className="text-muted-foreground text-sm font-medium">Tema</span>
				<ThemeToggle />
			</div>
			<div className="flex items-center gap-2.5 border-t px-4 py-3.5">
				<Avatar className="size-8">
					<AvatarFallback>{initials}</AvatarFallback>
				</Avatar>
				<div className="flex min-w-0 flex-col leading-tight">
					<span className="truncate text-sm font-medium">
						{currentUser?.fullName}
					</span>
					<span className="truncate text-muted-foreground text-xs">
						{activeRole?.name}
					</span>
				</div>
			</div>
		</div>
	);
}
