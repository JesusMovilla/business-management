"use client";

import { useMemo } from "react";
import { useCalendarStore } from "@/stores/calendar-store";
import type { CalendarEvent } from "@/types";
import { holidaysMock } from "../mock-data/holidays.mock";
import { pedidosMock } from "../mock-data/pedidos.mock";

/** Feriados + pedidos (semilla, solo lectura) combinados con los eventos creados por el usuario. */
export function useCalendarEvents(): CalendarEvent[] {
	const userEvents = useCalendarStore((state) => state.events);
	return useMemo(
		() => [...holidaysMock, ...pedidosMock, ...userEvents],
		[userEvents],
	);
}

export function useCalendarMutations() {
	const addEvent = useCalendarStore((state) => state.addEvent);
	const removeEvent = useCalendarStore((state) => state.removeEvent);
	return { addEvent, removeEvent };
}
