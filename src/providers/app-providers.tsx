"use client";

import type { ReactNode } from "react";
import { ServiceWorkerRegister } from "@/components/layout/service-worker-register";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: ReactNode }) {
	return (
		<TooltipProvider>
			<ServiceWorkerRegister />
			{children}
			<Toaster />
		</TooltipProvider>
	);
}
