import type { CalendarEvent, PurchaseOrder } from "@/types";

/**
 * Convierte pedidos reales (módulo Pedidos) en eventos de calendario: la fecha del pedido y,
 * si ya se confirmó, la fecha de recepción — ambas como eventos tipo "pedido".
 */
export function buildPedidosCalendarEvents(
	orders: PurchaseOrder[],
): CalendarEvent[] {
	const events: CalendarEvent[] = [];

	for (const order of orders) {
		events.push({
			id: `pedido-${order.id}-orden`,
			date: order.orderDate,
			type: "pedido",
			title: `Pedido a ${order.supplier}`,
			detail: `${order.lines.length} ${order.lines.length === 1 ? "producto" : "productos"} · ${order.status}`,
		});
		if (order.receivedDate) {
			events.push({
				id: `pedido-${order.id}-recibido`,
				date: order.receivedDate,
				type: "pedido",
				title: `Pedido de ${order.supplier} recibido`,
				detail: `${order.lines.length} ${order.lines.length === 1 ? "producto" : "productos"}`,
			});
		}
	}

	return events;
}
