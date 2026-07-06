import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_ROW_KEYS = Array.from(
	{ length: 12 },
	(_, index) => `skeleton-row-${index}`,
);

interface DataTableSkeletonProps {
	/** Cantidad de filas placeholder a mostrar. */
	rows?: number;
}

/**
 * Esqueleto genérico para rutas cuya página es un Server Component async con una `DataTable`
 * (toolbar + filas pulsantes) — pensado para usarse en el `loading.tsx` de esa ruta mientras
 * Next.js espera la respuesta del servidor. No calca las columnas reales de cada tabla, solo
 * comunica "esto es una tabla cargando".
 */
export function DataTableSkeleton({ rows = 6 }: DataTableSkeletonProps) {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<Skeleton className="h-7 w-48" />
				<Skeleton className="h-4 w-72" />
			</div>
			<div className="flex flex-col gap-3">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<Skeleton className="h-8 w-56" />
					<Skeleton className="h-8 w-32" />
				</div>
				<div className="rounded-md border">
					{SKELETON_ROW_KEYS.slice(0, rows).map((key) => (
						<div
							key={key}
							className="flex items-center gap-4 border-b p-3 last:border-b-0"
						>
							<Skeleton className="h-4 w-full" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
