"use client";

import { PermissionGuard } from "@/components/guards/permission-guard";
import { toast } from "@/lib/toast";
import { todayIso } from "../lib/month-grid";
import { EventFormDialog } from "./event-form-dialog";

/** Encabezado de la página de Calendario — separado en cliente para poder usar `EventFormDialog`. */
export function CalendarPageHeader() {
	return (
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
	);
}
