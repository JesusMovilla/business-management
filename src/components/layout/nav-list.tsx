"use client";

import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NavItemLink } from "@/components/layout/nav-item";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { NAV_ENTRIES, type NavGroup, type NavItem } from "@/lib/constants";
import { can } from "@/lib/rbac/can";
import { useActiveRole } from "@/lib/rbac/use-permission";
import { cn } from "@/lib/utils";

function isItemActive(pathname: string, href: string) {
	return pathname === href || pathname.startsWith(`${href}/`);
}

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

/** Grupo colapsable de ítems; se oculta si ningún ítem hijo es visible y se auto-expande si contiene la ruta activa. */
function NavGroupGuard({
	group,
	onNavigate,
}: {
	group: NavGroup;
	onNavigate?: () => void;
}) {
	const activeRole = useActiveRole();
	const pathname = usePathname();
	const visibleItems = group.items.filter(
		(item) => !item.module || can(activeRole, item.module, "ver"),
	);
	const hasActiveItem = visibleItems.some((item) =>
		isItemActive(pathname, item.href),
	);
	const [open, setOpen] = useState(hasActiveItem);
	const [prevHasActiveItem, setPrevHasActiveItem] = useState(hasActiveItem);
	if (hasActiveItem !== prevHasActiveItem) {
		setPrevHasActiveItem(hasActiveItem);
		if (hasActiveItem) setOpen(true);
	}

	if (visibleItems.length === 0) return null;

	const Icon = group.icon;

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger
				className={cn(
					"flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
					hasActiveItem
						? "bg-sidebar-accent text-sidebar-accent-foreground"
						: "text-muted-foreground hover:bg-muted hover:text-foreground",
				)}
			>
				<span className="flex items-center gap-3">
					<Icon className="size-4" />
					{group.label}
				</span>
				<ChevronDown
					className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
				/>
			</CollapsibleTrigger>
			<CollapsibleContent className="flex flex-col gap-1 pt-1 pl-4">
				{visibleItems.map((item) => (
					<NavItemLink key={item.href} item={item} onNavigate={onNavigate} />
				))}
			</CollapsibleContent>
		</Collapsible>
	);
}

/**
 * Lista de navegación filtrada por permisos (`ver` por módulo); compartida por `AppSidebar` (desktop) y
 * `MobileNav` (móvil). Renderiza ítems sueltos y grupos colapsables (`NAV_ENTRIES`); reusar este
 * patrón para cualquier nav secundaria.
 */
export function NavList({ onNavigate }: { onNavigate?: () => void }) {
	return (
		<nav className="flex flex-1 flex-col gap-1">
			{NAV_ENTRIES.map((entry) =>
				entry.type === "item" ? (
					<NavItemGuard
						key={entry.item.href}
						item={entry.item}
						onNavigate={onNavigate}
					/>
				) : (
					<NavGroupGuard
						key={entry.group.label}
						group={entry.group}
						onNavigate={onNavigate}
					/>
				),
			)}
		</nav>
	);
}
