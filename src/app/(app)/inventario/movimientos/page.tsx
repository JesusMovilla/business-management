import { PermissionGuard } from "@/components/guards/permission-guard";
import { BulkEntradaDialog } from "@/modules/inventario/components/bulk-entrada-dialog";
import { MovementsTable } from "@/modules/inventario/components/movements-table";

export default function MovimientosInventarioPage() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">Movimientos</h1>
					<p className="text-muted-foreground text-sm">
						Historial de entradas, ventas, mermas y ajustes de todos los
						productos.
					</p>
				</div>
				<PermissionGuard module="inventario" action="crear">
					<BulkEntradaDialog />
				</PermissionGuard>
			</div>
			<MovementsTable />
		</div>
	);
}
