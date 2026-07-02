"use client";

import { useState } from "react";
import { PermissionGuard } from "@/components/guards/permission-guard";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { CalendarEvent } from "@/types";
import { useCalendarEvents, useCalendarMutations } from "../hooks/use-calendar";
import { todayIso } from "../lib/month-grid";
import { CalendarDayPanel } from "./calendar-day-panel";
import { CalendarMonthGrid } from "./calendar-month-grid";
import { UpcomingEvents } from "./upcoming-events";

/** Orquesta el estado del calendario (mes visible, día seleccionado) y compone sus piezas. */
export function CalendarView() {
	const today = new Date();
	const [year, setYear] = useState(today.getFullYear());
	const [month, setMonth] = useState(today.getMonth());
	const [selectedDay, setSelectedDay] = useState(todayIso());
	const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(
		null,
	);

	const events = useCalendarEvents();
	const { removeEvent } = useCalendarMutations();
	const selectedDayEvents = events.filter(
		(event) => event.date === selectedDay,
	);

	const goToMonth = (delta: number) => {
		let nextMonth = month + delta;
		let nextYear = year;
		if (nextMonth < 0) {
			nextMonth = 11;
			nextYear -= 1;
		} else if (nextMonth > 11) {
			nextMonth = 0;
			nextYear += 1;
		}
		setMonth(nextMonth);
		setYear(nextYear);
	};

	return (
		<div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[2fr_1fr]">
			<div className="flex flex-col gap-4">
				<CalendarMonthGrid
					year={year}
					month={month}
					selectedDay={selectedDay}
					events={events}
					onSelectDay={setSelectedDay}
					onPrevMonth={() => goToMonth(-1)}
					onNextMonth={() => goToMonth(1)}
					onToday={() => {
						const now = new Date();
						setYear(now.getFullYear());
						setMonth(now.getMonth());
						setSelectedDay(todayIso());
					}}
				/>
				<CalendarDayPanel
					selectedDay={selectedDay}
					events={selectedDayEvents}
					onDeleteEvent={setEventToDelete}
				/>
			</div>
			<UpcomingEvents events={events} />

			<PermissionGuard module="calendario" action="eliminar">
				<AlertDialog
					open={!!eventToDelete}
					onOpenChange={(open) => !open && setEventToDelete(null)}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Eliminar evento</AlertDialogTitle>
							<AlertDialogDescription>
								¿Seguro que quieres eliminar &quot;{eventToDelete?.title}&quot;?
								Esta acción no se puede deshacer.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancelar</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => {
									if (eventToDelete) removeEvent(eventToDelete.id);
									setEventToDelete(null);
								}}
							>
								Eliminar
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</PermissionGuard>
		</div>
	);
}
