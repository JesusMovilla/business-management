"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/** Wrapper de `next-themes`; habilita modo claro/oscuro vía clase `.dark` en `<html>`. */
export function ThemeProvider({
	children,
	...props
}: ComponentProps<typeof NextThemesProvider>) {
	return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
