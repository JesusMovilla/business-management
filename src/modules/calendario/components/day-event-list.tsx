"use client";

import { Trash2 } from "lucide-react";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { Button } from "@/components/ui/button";
import type { CalendarEvent } from "@/types";
import { EventTypeBadge } from "./event-type-badge";

interface DayEventListProps {
	events: CalendarEvent[];
	onDeleteEvent?: (event: CalendarEvent) => void;
}

/** Lista de eventos de un día (badge + título + detalle); usada por el panel de día y el popover del calendario. */
export function DayEventList({ events, onDeleteEvent }: DayEventListProps) {
	if (!events.length) {
		return (
			<p className="text-muted-foreground text-sm">
				Sin eventos registrados este día.
			</p>
		);
	}

	return (
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
					{event.type === "evento" && onDeleteEvent && (
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
	);
}
