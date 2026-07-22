import { RouteGuard } from "@/components/guards/route-guard";
import { purchaseOrderRepository } from "@/data/repositories/purchase-order-repository";
import { PurchaseOrderTable } from "@/modules/pedidos/components/purchase-order-table";

// Los pedidos viven en Postgres real, no en un snapshot estático: renderizar por request.
export const dynamic = "force-dynamic";

export default async function PedidosPage() {
	const orders = await purchaseOrderRepository.list();

	return (
		<RouteGuard module="pedidos" action="ver">
			<div className="flex flex-col gap-6">
				<div>
					<h1 className="text-2xl font-semibold">Pedidos</h1>
					<p className="text-muted-foreground text-sm">
						Registra pedidos de compra a proveedores. Un pedido no afecta el
						inventario hasta que se confirma su recepción — ahí se genera la
						entrada de stock y el gasto correspondiente.
					</p>
				</div>
				<PurchaseOrderTable initialOrders={orders} />
			</div>
		</RouteGuard>
	);
}
