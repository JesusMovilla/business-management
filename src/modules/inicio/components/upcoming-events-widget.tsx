"use client";

import { UpcomingEvents } from "@/modules/calendario/components/upcoming-events";
import { useCalendarEvents } from "@/modules/calendario/hooks/use-calendar";

/** Envuelve `UpcomingEvents` de Calendario para usarlo fuera de ese módulo (Inicio). */
export function UpcomingEventsWidget() {
	const events = useCalendarEvents();
	return <UpcomingEvents events={events} />;
}
