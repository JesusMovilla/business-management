"use client";

import { PermissionGuard } from "@/components/guards/permission-guard";
import { toast } from "@/lib/toast";
import { CalendarView } from "@/modules/calendario/components/calendar-view";
import { EventFormDialog } from "@/modules/calendario/components/event-form-dialog";
import { todayIso } from "@/modules/calendario/lib/month-grid";

export default function CalendarioPage() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">Calendario</h1>
					<p className="text-muted-foreground text-sm">
						Pedidos, feriados colombianos y eventos del negocio.
					</p>
				</div>
				<PermissionGuard module="calendario" action="crear">
					<EventFormDialog
						defaultDate={todayIso()}
						onCreated={() => toast.success("Evento agregado.")}
					/>
				</PermissionGuard>
			</div>
			<CalendarView />
		</div>
	);
}
