"use client";

import { NavItemLink } from "@/components/layout/nav-item";
import { NAV_ITEMS, type NavItem } from "@/lib/constants";
import { usePermission } from "@/lib/rbac/use-permission";

function NavItemGuard({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const canView = usePermission(item.module, "ver");
  if (!canView) return null;
  return <NavItemLink item={item} onNavigate={onNavigate} />;
}

export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <NavItemGuard key={item.href} item={item} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}
