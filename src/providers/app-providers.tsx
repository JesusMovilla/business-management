"use client";

import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: ReactNode }) {
	return (
		<TooltipProvider>
			{children}
			<Toaster />
		</TooltipProvider>
	);
}
