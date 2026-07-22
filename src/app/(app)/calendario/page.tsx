import { purchaseOrderRepository } from "@/data/repositories/purchase-order-repository";
import { CalendarPageHeader } from "@/modules/calendario/components/calendar-page-header";
import { CalendarView } from "@/modules/calendario/components/calendar-view";
import { buildPedidosCalendarEvents } from "@/modules/calendario/mock-data/pedidos.mock";

// Los pedidos que alimentan el calendario viven en Postgres real: renderizar por request.
export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
	const orders = await purchaseOrderRepository.list();
	const pedidoEvents = buildPedidosCalendarEvents(orders);

	return (
		<div className="flex flex-col gap-6">
			<CalendarPageHeader />
			<CalendarView pedidoEvents={pedidoEvents} />
		</div>
	);
}
