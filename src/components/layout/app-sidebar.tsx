"use client";

import { NavList } from "@/components/layout/nav-list";

export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-background p-4 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
          M
        </div>
        <span className="text-lg font-semibold">Mogo</span>
      </div>
      <NavList />
    </aside>
  );
}
