"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const OPTIONS = [
	{ value: "light", label: "Claro", icon: Sun },
	{ value: "dark", label: "Oscuro", icon: Moon },
	{ value: "system", label: "Sistema", icon: Monitor },
] as const;

/**
 * Selector de tema claro/oscuro/sistema (`next-themes`). Se renderiza vacío hasta montar en
 * cliente para evitar mismatch de hidratación entre el tema del servidor y el guardado del usuario.
 */
/** Nunca notifica cambios: solo distingue snapshot de servidor (false) vs. cliente (true). */
function subscribeNever() {
	return () => {};
}

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const mounted = useSyncExternalStore(
		subscribeNever,
		() => true,
		() => false,
	);

	if (!mounted) return <div className="size-8" />;

	const current =
		OPTIONS.find((option) => option.value === theme) ?? OPTIONS[2];
	const CurrentIcon = current.icon;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="ghost" size="icon">
						<CurrentIcon className="size-4" />
						<span className="sr-only">Cambiar tema</span>
					</Button>
				}
			/>
			<DropdownMenuContent align="end">
				{OPTIONS.map((option) => (
					<DropdownMenuItem
						key={option.value}
						onClick={() => setTheme(option.value)}
					>
						<option.icon className="size-4" />
						{option.label}
						{theme === option.value && <Check className="ml-auto size-4" />}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
