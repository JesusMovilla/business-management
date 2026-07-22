"use client";

import { useMemo } from "react";
import { useCalendarStore } from "@/stores/calendar-store";
import type { CalendarEvent } from "@/types";
import { holidaysMock } from "../mock-data/holidays.mock";

/** Feriados (semilla, solo lectura) + pedidos reales + eventos creados por el usuario. */
export function useCalendarEvents(
	pedidoEvents: CalendarEvent[],
): CalendarEvent[] {
	const userEvents = useCalendarStore((state) => state.events);
	return useMemo(
		() => [...holidaysMock, ...pedidoEvents, ...userEvents],
		[pedidoEvents, userEvents],
	);
}

export function useCalendarMutations() {
	const addEvent = useCalendarStore((state) => state.addEvent);
	const removeEvent = useCalendarStore((state) => state.removeEvent);
	return { addEvent, removeEvent };
}
