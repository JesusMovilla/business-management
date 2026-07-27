import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function RentabilidadLoading() {
	return (
		<div className="flex flex-col gap-6">
			<Skeleton className="h-10 w-72" />
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Skeleton className="h-24 w-full" />
				<Skeleton className="h-24 w-full" />
				<Skeleton className="h-24 w-full" />
				<Skeleton className="h-24 w-full" />
			</div>
			<Skeleton className="h-72 w-full" />
			<DataTableSkeleton />
		</div>
	);
}
