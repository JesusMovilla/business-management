"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { NavList } from "@/components/layout/nav-list";
import { SidebarFooter } from "@/components/layout/sidebar-footer";
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
			<SheetTrigger
				render={<Button variant="ghost" size="icon" className="md:hidden" />}
			>
				<Menu className="size-5" />
				<span className="sr-only">Abrir menú</span>
			</SheetTrigger>
			<SheetContent side="left" className="flex w-72 flex-col p-0">
				<SheetHeader className="border-b">
					<SheetTitle className="flex items-center gap-2">
						<div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
							M
						</div>
						Mogo
					</SheetTitle>
				</SheetHeader>
				<div className="flex-1 overflow-y-auto p-4">
					<NavList onNavigate={() => setOpen(false)} />
				</div>
				<SidebarFooter />
			</SheetContent>
		</Sheet>
	);
}
