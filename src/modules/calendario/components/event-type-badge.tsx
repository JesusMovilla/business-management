import { cn } from "@/lib/utils";
import type { CalendarEventType } from "@/types";
import {
	EVENT_TYPE_BADGE_CLASSNAME,
	EVENT_TYPE_LABELS,
} from "../lib/event-meta";

/** Pill de tipo de evento (feriado/pedido/evento), con colores semánticos que se adaptan a modo oscuro. */
export function EventTypeBadge({ type }: { type: CalendarEventType }) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
				EVENT_TYPE_BADGE_CLASSNAME[type],
			)}
		>
			{EVENT_TYPE_LABELS[type]}
		</span>
	);
}
