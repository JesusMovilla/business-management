"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { RoleSwitcher } from "@/modules/admin-permisos/components/role-switcher";
import { useRoles } from "@/modules/admin-permisos/hooks/use-roles";
import { useAuthStore } from "@/stores/auth-store";
import { useRbacStore } from "@/stores/rbac-store";

export function AppTopbar() {
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
    <header className="flex items-center justify-between gap-2 border-b bg-background px-3 py-3 sm:gap-4 sm:px-6">
      <MobileNav />
      <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
        <RoleSwitcher />
        <div className="flex items-center gap-2">
          <Avatar className="size-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-medium">{currentUser?.fullName}</span>
            <span className="text-muted-foreground text-xs">{activeRole?.name}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
