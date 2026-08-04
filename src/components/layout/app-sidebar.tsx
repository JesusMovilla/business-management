"use client";

import { AppLogoMark } from "@/components/layout/app-logo-mark";
import { NavList } from "@/components/layout/nav-list";
import { SidebarFooter } from "@/components/layout/sidebar-footer";

/**
 * Sidebar de navegación para escritorio (`hidden md:flex`); en móvil se usa `MobileNav`.
 * El shell raíz (`(app)/layout.tsx`) es `h-screen overflow-hidden`, así que esta columna solo
 * necesita `h-full` para quedar fija mientras `main` scrollea de forma independiente.
 */
export function AppSidebar() {
	return (
		<aside className="hidden h-full w-64 shrink-0 flex-col border-r bg-background md:flex">
			<div className="flex items-center gap-2 px-6 py-4">
				<AppLogoMark />
				<span className="text-base font-semibold leading-tight">
					Gestión de negocio
				</span>
			</div>
			<div className="flex-1 overflow-y-auto px-4">
				<NavList />
			</div>
			<SidebarFooter />
		</aside>
	);
}
