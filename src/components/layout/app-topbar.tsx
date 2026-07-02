"use client";

import { MobileNav } from "@/components/layout/mobile-nav";

/**
 * Barra superior, visible solo en móvil (`flex md:hidden`) — su único contenido es el trigger
 * de `MobileNav`. Tema, rol activo y datos del usuario viven en `SidebarFooter`
 * (`AppSidebar`/`MobileNav`); en desktop esa info ya está en el sidebar, así que la topbar no
 * ocupa espacio ahí.
 */
export function AppTopbar() {
	return (
		<header className="flex items-center gap-2 border-b bg-background px-3 py-3 md:hidden">
			<MobileNav />
			<span className="font-semibold text-sm">Mogo</span>
		</header>
	);
}
