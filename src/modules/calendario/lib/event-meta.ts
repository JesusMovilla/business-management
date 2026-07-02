import type { CalendarEventType } from "@/types";

export const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
	feriado: "Feriado",
	pedido: "Pedido",
	evento: "Evento",
};

/** "Feriado" reutiliza el acento de marca (`--sidebar-accent`/`--primary`); pedido/evento tienen sus propios tokens en `globals.css`. */
export const EVENT_TYPE_BADGE_CLASSNAME: Record<CalendarEventType, string> = {
	feriado: "bg-sidebar-accent text-sidebar-accent-foreground",
	pedido: "bg-(--calendar-pedido-bg) text-(--calendar-pedido-fg)",
	evento: "bg-(--calendar-evento-bg) text-(--calendar-evento-fg)",
};

export const EVENT_TYPE_DOT_CLASSNAME: Record<CalendarEventType, string> = {
	feriado: "bg-primary",
	pedido: "bg-(--calendar-pedido-dot)",
	evento: "bg-(--calendar-evento-dot)",
};
