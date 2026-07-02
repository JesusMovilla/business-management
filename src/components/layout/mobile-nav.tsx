"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { NavList } from "@/components/layout/nav-list";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/** Navegación para móvil: `Sheet` con `side="left"`, visible solo debajo de `md`. */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
        <Menu className="size-5" />
        <span className="sr-only">Abrir menú</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
              M
            </div>
            Mogo
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col p-4">
          <NavList onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
