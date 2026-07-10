"use client";

import type { CalendarEvent } from "@/types";
import { formatDayLabel } from "../lib/month-grid";
import { DayEventList } from "./day-event-list";

interface CalendarDayPanelProps {
	selectedDay: string;
	events: CalendarEvent[];
	onDeleteEvent?: (event: CalendarEvent) => void;
}

/** Detalle del día seleccionado en el calendario: feriados/pedidos/eventos de esa fecha. */
export function CalendarDayPanel({
	selectedDay,
	events,
	onDeleteEvent,
}: CalendarDayPanelProps) {
	return (
		<div className="rounded-lg border bg-card p-4">
			<div className="mb-2.5 font-semibold text-sm capitalize">
				{formatDayLabel(selectedDay)}
			</div>
			<DayEventList events={events} onDeleteEvent={onDeleteEvent} />
		</div>
	);
}
