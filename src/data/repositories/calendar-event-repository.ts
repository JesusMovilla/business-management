import { useCalendarStore } from "@/stores/calendar-store";

export const calendarEventRepository = {
	async list() {
		return useCalendarStore.getState().events;
	},
	async create(input: { date: string; title: string; detail?: string }) {
		return useCalendarStore.getState().addEvent(input);
	},
	async remove(id: string): Promise<void> {
		useCalendarStore.getState().removeEvent(id);
	},
};
