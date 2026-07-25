import { PageHeader } from "@/components/layout/page-header";
import { MovementsTable } from "@/modules/inventario/components/movements-table";

export default function MovimientosInventarioPage() {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Movimientos"
				description="Historial de entradas, ventas, mermas y ajustes de todos los productos. Las entradas por compra se registran desde un pedido confirmado en el módulo Pedidos."
				backHref="/inventario"
			/>
			<MovementsTable />
		</div>
	);
}
