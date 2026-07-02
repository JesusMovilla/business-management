import { create } from "zustand";
import type { CalendarEvent } from "@/types";

interface CalendarState {
	events: CalendarEvent[];
	addEvent: (input: { date: string; title: string; detail?: string }) => string;
	removeEvent: (id: string) => void;
}

/**
 * Solo guarda eventos de tipo "evento" (creados a mano). Feriados y pedidos son datos semilla
 * de solo lectura (`holidays.mock.ts`, `pedidos.mock.ts`), combinados en `useCalendarEvents`.
 */
export const useCalendarStore = create<CalendarState>((set) => ({
	events: [],

	addEvent: (input) => {
		const id = `evt-${Math.random().toString(36).slice(2, 10)}`;
		set((state) => ({
			events: [...state.events, { ...input, id, type: "evento" }],
		}));
		return id;
	},

	removeEvent: (id) => {
		set((state) => ({
			events: state.events.filter((event) => event.id !== id),
		}));
	},
}));
