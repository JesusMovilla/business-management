"use client";

import { Trash2 } from "lucide-react";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { Button } from "@/components/ui/button";
import type { CalendarEvent } from "@/types";
import { formatDayLabel } from "../lib/month-grid";
import { EventTypeBadge } from "./event-type-badge";

interface CalendarDayPanelProps {
	selectedDay: string;
	events: CalendarEvent[];
	onDeleteEvent: (event: CalendarEvent) => void;
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
			{events.length ? (
				<div className="flex flex-col gap-2">
					{events.map((event) => (
						<div
							key={event.id}
							className="flex items-start justify-between gap-2 rounded-md bg-muted p-2.5"
						>
							<div className="min-w-0">
								<EventTypeBadge type={event.type} />
								<div className="mt-1 font-medium text-sm">{event.title}</div>
								{event.detail && (
									<div className="text-muted-foreground text-xs">
										{event.detail}
									</div>
								)}
							</div>
							{event.type === "evento" && (
								<PermissionGuard module="calendario" action="eliminar">
									<Button
										variant="ghost"
										size="icon-sm"
										className="shrink-0 text-destructive"
										onClick={() => onDeleteEvent(event)}
									>
										<Trash2 className="size-3.5" />
									</Button>
								</PermissionGuard>
							)}
						</div>
					))}
				</div>
			) : (
				<p className="text-muted-foreground text-sm">
					Sin eventos registrados este día.
				</p>
			)}
		</div>
	);
}
