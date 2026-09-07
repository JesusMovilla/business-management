import { BottleWine } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLogoMarkProps {
	/** Tamaño del cuadrado (por defecto `size-8`, como en el sidebar/topbar). */
	className?: string;
	/** Tamaño del ícono dentro del cuadrado (por defecto `size-4`). */
	iconClassName?: string;
}

/**
 * Marca cuadrada del logo (botella, alude al rubro de venta de bebidas alcohólicas). Reutilizada
 * en `AppSidebar`, `MobileNav`, `AppTopbar` y la pantalla de login para no duplicar el mismo `div`
 * + ícono. `iconClassName` permite escalar el ícono junto con `className` en usos más grandes
 * (ej. login).
 */
export function AppLogoMark({ className, iconClassName }: AppLogoMarkProps) {
	return (
		<div
			className={cn(
				"flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground",
				className,
			)}
		>
			<BottleWine className={cn("size-4", iconClassName)} />
		</div>
	);
}
