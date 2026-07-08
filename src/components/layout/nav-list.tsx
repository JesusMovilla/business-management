"use client";

import { NavItemLink } from "@/components/layout/nav-item";
import { NAV_ITEMS, type NavItem } from "@/lib/constants";
import { can } from "@/lib/rbac/can";
import { useActiveRole } from "@/lib/rbac/use-permission";

function NavItemGuard({
	item,
	onNavigate,
}: {
	item: NavItem;
	onNavigate?: () => void;
}) {
	const activeRole = useActiveRole();
	if (item.module && !can(activeRole, item.module, "ver")) return null;
	return <NavItemLink item={item} onNavigate={onNavigate} />;
}

/**
 * Lista de navegación filtrada por permisos (`ver` por módulo); compartida por `AppSidebar` (desktop) y
 * `MobileNav` (móvil). Reusar este patrón para cualquier nav secundaria.
 */
export function NavList({ onNavigate }: { onNavigate?: () => void }) {
	return (
		<nav className="flex flex-1 flex-col gap-1">
			{NAV_ITEMS.map((item) => (
				<NavItemGuard key={item.href} item={item} onNavigate={onNavigate} />
			))}
		</nav>
	);
}
