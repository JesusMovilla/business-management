export const CALENDAR_EVENT_TYPES = ["feriado", "pedido", "evento"] as const;

export type CalendarEventType = (typeof CALENDAR_EVENT_TYPES)[number];

export interface CalendarEvent {
	id: string;
	date: string;
	type: CalendarEventType;
	title: string;
	detail?: string;
}
