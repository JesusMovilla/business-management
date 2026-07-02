"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types";
import { EVENT_TYPE_DOT_CLASSNAME, EVENT_TYPE_LABELS } from "../lib/event-meta";
import { buildMonthGrid, monthLabel, todayIso } from "../lib/month-grid";

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MAX_DOTS_PER_DAY = 3;

interface CalendarMonthGridProps {
	year: number;
	month: number;
	selectedDay: string;
	events: CalendarEvent[];
	onSelectDay: (iso: string) => void;
	onPrevMonth: () => void;
	onNextMonth: () => void;
	onToday: () => void;
}

/** Grilla mensual (domingo a sábado); cada día muestra hasta 3 puntos de color por tipo de evento. */
export function CalendarMonthGrid({
	year,
	month,
	selectedDay,
	events,
	onSelectDay,
	onPrevMonth,
	onNextMonth,
	onToday,
}: CalendarMonthGridProps) {
	const weeks = useMemo(() => buildMonthGrid(year, month), [year, month]);
	const eventsByDate = useMemo(() => {
		const map = new Map<string, CalendarEvent[]>();
		for (const event of events) {
			map.set(event.date, [...(map.get(event.date) ?? []), event]);
		}
		return map;
	}, [events]);
	const today = todayIso();

	return (
		<div className="rounded-lg border bg-card p-4">
			<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
				<span className="font-semibold capitalize">
					{monthLabel(year, month)}
				</span>
				<div className="flex items-center gap-1.5">
					<Button variant="outline" size="icon-sm" onClick={onPrevMonth}>
						<ChevronLeft className="size-4" />
					</Button>
					<Button variant="outline" size="sm" onClick={onToday}>
						Hoy
					</Button>
					<Button variant="outline" size="icon-sm" onClick={onNextMonth}>
						<ChevronRight className="size-4" />
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-7 gap-1">
				{WEEKDAY_LABELS.map((label) => (
					<div
						key={label}
						className="py-1 text-center font-semibold text-muted-foreground text-xs uppercase"
					>
						{label}
					</div>
				))}
			</div>

			{weeks.map((week) => (
				<div
					key={week.map((day) => day.iso || day.dayNumber).join("-")}
					className="grid grid-cols-7 gap-1"
				>
					{week.map((day, index) => {
						const dayEvents = day.iso ? (eventsByDate.get(day.iso) ?? []) : [];
						const isToday = day.iso === today;
						const isSelected = day.iso === selectedDay;
						return (
							<button
								key={day.iso || `pad-${index}`}
								type="button"
								disabled={!day.inMonth}
								onClick={() => day.iso && onSelectDay(day.iso)}
								className={cn(
									"flex h-10 flex-col items-center justify-center gap-0.5 rounded-md border border-transparent p-1 text-sm sm:h-12",
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
								<span className="flex h-1.5 justify-center gap-0.5">
									{dayEvents.slice(0, MAX_DOTS_PER_DAY).map((event) => (
										<span
											key={event.id}
											className={cn(
												"size-1.5 rounded-full",
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

			<div className="mt-3 flex flex-wrap gap-3 border-t pt-3 text-muted-foreground text-xs">
				{(
					Object.keys(EVENT_TYPE_LABELS) as Array<
						keyof typeof EVENT_TYPE_LABELS
					>
				).map((type) => (
					<div key={type} className="flex items-center gap-1.5">
						<span
							className={cn(
								"size-2 rounded-full",
								EVENT_TYPE_DOT_CLASSNAME[type],
							)}
						/>
						{EVENT_TYPE_LABELS[type]}
					</div>
				))}
			</div>
		</div>
	);
}
