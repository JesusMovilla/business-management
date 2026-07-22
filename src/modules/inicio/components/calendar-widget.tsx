"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EventTypeBadge } from "@/modules/calendario/components/event-type-badge";
import { useCalendarEvents } from "@/modules/calendario/hooks/use-calendar";
import { EVENT_TYPE_DOT_CLASSNAME } from "@/modules/calendario/lib/event-meta";
import {
	buildMonthGrid,
	formatDayLabel,
	monthLabel,
	todayIso,
} from "@/modules/calendario/lib/month-grid";
import type { CalendarEvent } from "@/types";

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MAX_DOTS_PER_DAY = 3;

interface CalendarWidgetProps {
	pedidoEvents: CalendarEvent[];
}

/**
 * Calendario compacto para Inicio: grilla del mes + eventos del día seleccionado en la misma
 * tarjeta (una sola caja, sin panel lateral separado). Solo lectura — enlaza a `/calendario` para
 * la vista completa con creación/eliminación de eventos.
 */
export function CalendarWidget({ pedidoEvents }: CalendarWidgetProps) {
	const [year, setYear] = useState(() => new Date().getFullYear());
	const [month, setMonth] = useState(() => new Date().getMonth());
	const [selectedDay, setSelectedDay] = useState(() => todayIso());

	const events = useCalendarEvents(pedidoEvents);
	const weeks = useMemo(() => buildMonthGrid(year, month), [year, month]);
	const eventsByDate = useMemo(() => {
		const map = new Map<string, CalendarEvent[]>();
		for (const event of events) {
			map.set(event.date, [...(map.get(event.date) ?? []), event]);
		}
		return map;
	}, [events]);
	const today = todayIso();
	const selectedDayEvents = eventsByDate.get(selectedDay) ?? [];

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
		<div className="flex flex-col gap-3">
			<div className="rounded-lg border bg-card p-4">
				<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
					<span className="font-bold text-sm capitalize">
						{monthLabel(year, month)}
					</span>
					<div className="flex items-center gap-1.5">
						<Button
							variant="outline"
							size="icon-xs"
							onClick={() => goToMonth(-1)}
						>
							<ChevronLeft className="size-3.5" />
						</Button>
						<Button
							variant="outline"
							size="xs"
							onClick={() => {
								const now = new Date();
								setYear(now.getFullYear());
								setMonth(now.getMonth());
								setSelectedDay(todayIso());
							}}
						>
							Hoy
						</Button>
						<Button
							variant="outline"
							size="icon-xs"
							onClick={() => goToMonth(1)}
						>
							<ChevronRight className="size-3.5" />
						</Button>
					</div>
				</div>

				<div className="mb-[3px] grid grid-cols-7 gap-[3px]">
					{WEEKDAY_LABELS.map((label) => (
						<div
							key={label}
							className="py-0.5 text-center font-semibold text-[10px] text-muted-foreground uppercase"
						>
							{label}
						</div>
					))}
				</div>

				{weeks.map((week) => (
					<div
						key={week.map((day) => day.iso || day.dayNumber).join("-")}
						className="mb-[3px] grid grid-cols-7 gap-[3px]"
					>
						{week.map((day) => {
							const dayEvents = day.iso
								? (eventsByDate.get(day.iso) ?? [])
								: [];
							const isToday = day.iso === today;
							const isSelected = day.iso === selectedDay;
							return (
								<button
									key={day.iso || `pad-${day.dayNumber}`}
									type="button"
									disabled={!day.inMonth}
									onClick={() => day.iso && setSelectedDay(day.iso)}
									className={cn(
										"flex h-8 flex-col items-center justify-center gap-0.5 rounded-md border border-transparent p-1 text-xs",
										day.inMonth
											? "cursor-pointer text-foreground"
											: "cursor-default text-muted-foreground opacity-40",
										isToday && !isSelected && "bg-muted",
										isSelected && "border-primary bg-sidebar-accent",
									)}
								>
									<span
										className={cn(
											"font-medium",
											(isToday || isSelected) && "font-bold",
											isToday && "text-sidebar-accent-foreground",
										)}
									>
										{day.dayNumber}
									</span>
									<span className="flex h-1 justify-center gap-0.5">
										{dayEvents.slice(0, MAX_DOTS_PER_DAY).map((event) => (
											<span
												key={event.id}
												className={cn(
													"size-1 rounded-full",
													EVENT_TYPE_DOT_CLASSNAME[event.type],
												)}
											/>
										))}
									</span>
								</button>
							);
						})}
					</div>
				))}

				<div className="mt-3 border-t pt-3">
					<div className="mb-2 font-bold text-xs capitalize">
						{formatDayLabel(selectedDay)}
					</div>
					{selectedDayEvents.length ? (
						<div className="flex flex-col gap-1.5">
							{selectedDayEvents.map((event) => (
								<div key={event.id} className="rounded-md bg-muted p-2">
									<EventTypeBadge type={event.type} />
									<div className="mt-1 font-semibold text-xs">
										{event.title}
									</div>
								</div>
							))}
						</div>
					) : (
						<p className="text-muted-foreground text-xs">
							Sin eventos registrados este día.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
