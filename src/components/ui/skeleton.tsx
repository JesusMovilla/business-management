import { cn } from "@/lib/utils";

/**
 * Placeholder pulsante para contenido que todavía se está cargando (ej. dentro de un
 * `loading.tsx` de ruta). Pasa `className` para darle el tamaño/forma del contenido real que
 * va a reemplazar (ej. `className="h-4 w-32"` para una línea de texto).
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="skeleton"
			className={cn("animate-pulse rounded-md bg-muted", className)}
			{...props}
		/>
	);
}

export { Skeleton };
