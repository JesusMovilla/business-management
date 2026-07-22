import { MovementsTable } from "@/modules/inventario/components/movements-table";

export default function MovimientosInventarioPage() {
	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-semibold">Movimientos</h1>
				<p className="text-muted-foreground text-sm">
					Historial de entradas, ventas, mermas y ajustes de todos los
					productos. Las entradas por compra se registran desde un pedido
					confirmado en el módulo Pedidos.
				</p>
			</div>
			<MovementsTable />
		</div>
	);
}
