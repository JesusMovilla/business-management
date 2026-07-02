"use client";

import { MobileNav } from "@/components/layout/mobile-nav";
import { RoleSwitcher } from "@/modules/admin-permisos/components/role-switcher";

/**
 * Barra superior: trigger de nav móvil y selector de rol activo. El tema y los datos del
 * usuario logueado viven en `SidebarFooter` (dentro de `AppSidebar`/`MobileNav`).
 */
export function AppTopbar() {
	return (
		<header className="flex items-center justify-between gap-2 border-b bg-background px-3 py-3 sm:gap-4 sm:px-6">
			<MobileNav />
			<div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
				<RoleSwitcher />
			</div>
		</header>
	);
}
