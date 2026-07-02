"use client";

import { useTheme } from "next-themes";
import { Toaster as SileoToaster } from "sileo";
import "sileo/styles.css";

const POPOVER_FILL = {
	light: "oklch(1 0 0)",
	dark: "oklch(0.205 0 0)",
};

/**
 * Contenedor de toasts (sileo); montar una sola vez en la raíz. Usar `toast` de
 * `@/lib/toast` (no `sileo` directamente) para disparar notificaciones.
 *
 * No usamos la prop `theme` de sileo: su mapa interno de colores (`THEME_FILLS`) tiene
 * light/dark invertidos (tema oscuro → fondo claro). En vez de confiar en que el `fill` (un
 * atributo SVG) resuelva `var(--popover)` de forma consistente, calculamos el color literal
 * según `resolvedTheme` de next-themes — así el toast sigue el tema elegido por el usuario
 * (claro/oscuro/sistema ya resuelto), no el del sistema operativo a secas.
 */
function Toaster() {
	const { resolvedTheme } = useTheme();
	const fill = POPOVER_FILL[resolvedTheme === "dark" ? "dark" : "light"];

	return (
		<SileoToaster
			position="bottom-right"
			options={{
				fill,
				duration: 3000,
				styles: {
					title: "text-popover-foreground",
					description: "text-muted-foreground",
				},
			}}
		/>
	);
}

export { Toaster };
