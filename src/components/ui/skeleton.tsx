import { cn } from "@/lib/utils";

/** Placeholder de carga con animación pulse; el tamaño se define vía `className`. */
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
