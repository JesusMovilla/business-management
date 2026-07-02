import type { CalendarEvent } from "@/types";

const PEDIDOS_SEED: { date: string; label: string; detail: string }[] = [
	{
		date: "2026-06-25",
		label: "Pedido a Distribuidora Andina",
		detail: "18 cajas · vinos y espumantes",
	},
	{
		date: "2026-06-30",
		label: "Pedido a Bebidas Continental",
		detail: "40 cajas · cerveza",
	},
	{
		date: "2026-07-02",
		label: "Pedido a Global Spirits SA",
		detail: "12 unidades · licores premium",
	},
	{
		date: "2026-07-08",
		label: "Pedido a Bodega del Sol",
		detail: "24 cajas · vinos",
	},
	{
		date: "2026-07-15",
		label: "Pedido a Craft Import Co.",
		detail: "30 unidades · cerveza artesanal",
	},
	{
		date: "2026-07-24",
		label: "Pedido a Distribuidora Andina",
		detail: "15 cajas · surtido",
	},
];

/**
 * Datos de ejemplo — el módulo Pedidos todavía no existe (ver `docs/MODULES.md`), así que estas
 * fechas son ilustrativas. Cuando se construya Pedidos, reemplazar por datos reales del store.
 */
export const pedidosMock: CalendarEvent[] = PEDIDOS_SEED.map(
	(pedido, index) => ({
		id: `pedido-${index}-${pedido.date}`,
		date: pedido.date,
		type: "pedido",
		title: pedido.label,
		detail: pedido.detail,
	}),
);
