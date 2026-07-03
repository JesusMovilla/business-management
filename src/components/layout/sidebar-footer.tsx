"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChangePasswordDialog } from "@/components/layout/change-password-dialog";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth/client";
import { useActiveRole } from "@/lib/rbac/use-permission";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Pie del menú de navegación: selector de tema y menú del usuario logueado (avatar, nombre, rol,
 * cambiar contraseña, cerrar sesión). Compartido por `AppSidebar` (desktop) y `MobileNav`.
 */
export function SidebarFooter() {
	const router = useRouter();
	const currentUser = useAuthStore((state) => state.currentUser);
	const activeRole = useActiveRole();
	const [changePasswordOpen, setChangePasswordOpen] = useState(false);

	const initials = currentUser?.name
		.split(" ")
		.map((part) => part[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();

	const handleSignOut = async () => {
		await authClient.signOut();
		router.push("/login");
	};

	return (
		<div className="mt-auto border-t">
			<div className="flex items-center justify-between gap-2 px-4 py-2.5">
				<span className="text-muted-foreground text-sm font-medium">Tema</span>
				<ThemeToggle />
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger className="flex w-full cursor-pointer items-center gap-2.5 border-t px-4 py-3.5 text-left hover:bg-accent">
					<Avatar className="size-8">
						<AvatarFallback>{initials}</AvatarFallback>
					</Avatar>
					<div className="flex min-w-0 flex-col leading-tight">
						<span className="truncate text-sm font-medium">
							{currentUser?.name}
						</span>
						<span className="truncate text-muted-foreground text-xs">
							{activeRole?.name}
						</span>
					</div>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" side="top">
					<DropdownMenuItem onClick={() => setChangePasswordOpen(true)}>
						Cambiar contraseña
					</DropdownMenuItem>
					<DropdownMenuItem variant="destructive" onClick={handleSignOut}>
						Cerrar sesión
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<ChangePasswordDialog
				open={changePasswordOpen}
				onOpenChange={setChangePasswordOpen}
			/>
		</div>
	);
}
