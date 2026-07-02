"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Enlace de navegación individual; resalta el estado activo comparando con la ruta actual. */
export function NavItemLink({
	item,
	onNavigate,
}: {
	item: NavItem;
	onNavigate?: () => void;
}) {
	const pathname = usePathname();
	const isActive =
		pathname === item.href || pathname.startsWith(`${item.href}/`);
	const Icon = item.icon;

	return (
		<Link
			href={item.href}
			onClick={onNavigate}
			className={cn(
				"flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
				isActive
					? "bg-sidebar-accent text-sidebar-accent-foreground"
					: "text-muted-foreground hover:bg-muted hover:text-foreground",
			)}
		>
			<Icon className="size-4" />
			{item.label}
		</Link>
	);
}
