import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types";
import { formatShortDayLabel, todayIso } from "../lib/month-grid";
import { EventTypeBadge } from "./event-type-badge";

const MAX_UPCOMING = 8;

interface UpcomingEventsProps {
	events: CalendarEvent[];
}

/** Próximos 8 eventos (feriados, pedidos y eventos propios) desde hoy en adelante. */
export function UpcomingEvents({ events }: UpcomingEventsProps) {
	const today = todayIso();
	const upcoming = [...events]
		.filter((event) => event.date >= today)
		.sort((a, b) => a.date.localeCompare(b.date))
		.slice(0, MAX_UPCOMING);

	return (
		<div className="rounded-lg border bg-card p-4">
			<div className="mb-3 font-semibold text-sm">Próximos eventos</div>
			{upcoming.length ? (
				<div className="flex flex-col gap-2.5">
					{upcoming.map((event) => (
						<div
							key={event.id}
							className="flex items-start gap-2.5 border-b pb-2.5"
						>
							<div
								className={cn(
									"shrink-0 rounded-md px-1.5 py-1 text-center font-bold text-xs capitalize leading-tight",
									event.date === today
										? "bg-sidebar-accent text-sidebar-accent-foreground"
										: "bg-muted text-foreground",
								)}
							>
								{formatShortDayLabel(event.date)}
							</div>
							<div className="min-w-0">
								<EventTypeBadge type={event.type} />
								<div className="mt-1 font-medium text-sm">{event.title}</div>
								{event.detail && (
									<div className="text-muted-foreground text-xs">
										{event.detail}
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			) : (
				<p className="text-muted-foreground text-sm">
					No hay eventos próximos.
				</p>
			)}
		</div>
	);
}
