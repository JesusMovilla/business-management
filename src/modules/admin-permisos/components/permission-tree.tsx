"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { ACTION_LABELS, PERMISSION_ACTIONS } from "@/lib/rbac/actions";
import { MODULE_LABELS } from "@/lib/rbac/modules";
import { cn } from "@/lib/utils";
import type { AppModule, PermissionAction, PermissionTree } from "@/types";
import { APP_MODULES } from "@/types";

const SECONDARY_ACTIONS = PERMISSION_ACTIONS.filter(
	(action) => action !== "ver",
) as Exclude<PermissionAction, "ver">[];

interface PermissionTreeEditorProps {
	permissions: PermissionTree;
	onToggle: (module: AppModule, action: PermissionAction) => void;
	disabled?: boolean;
}

function summarize(actions: Record<PermissionAction, boolean>) {
	if (!actions.ver) return "Sin acceso";
	const active = SECONDARY_ACTIONS.filter((action) => actions[action]);
	if (active.length === 0) return "Solo lectura";
	return `Ver · ${active.map((action) => ACTION_LABELS[action]).join(", ")}`;
}

/**
 * Editor de la matriz de permisos módulo × acción de un rol.
 * Tabla en escritorio (columna "Ver" resaltada como acceso base, Crear/Editar/Eliminar agrupadas
 * como acciones que dependen de ella) y acordeón en móvil (un módulo expandido a la vez).
 * `disabled` bloquea todos los interruptores — úsalo para roles de sistema.
 */
export function PermissionTreeEditor({
	permissions,
	onToggle,
	disabled,
}: PermissionTreeEditorProps) {
	const [expandedModule, setExpandedModule] = useState<AppModule | null>(
		APP_MODULES[0],
	);

	const findEntry = (module: AppModule) =>
		permissions.find((entry) => entry.module === module)?.actions ?? {
			ver: false,
			crear: false,
			editar: false,
			eliminar: false,
		};

	return (
		<div className="flex flex-col gap-3">
			<p className="text-sm leading-relaxed text-muted-foreground">
				<strong className="font-semibold text-foreground">Ver</strong> es la
				base de acceso al módulo. Al activar{" "}
				<strong className="font-semibold text-foreground">
					Crear, Editar o Eliminar
				</strong>{" "}
				se activa <strong className="font-semibold text-foreground">Ver</strong>{" "}
				automáticamente; al desactivar{" "}
				<strong className="font-semibold text-foreground">Ver</strong> se
				desactivan las demás.
			</p>

			{/* Tabla — escritorio */}
			<div className="hidden overflow-hidden rounded-lg border md:block">
				<table className="w-full border-collapse text-sm">
					<thead>
						<tr>
							<th
								rowSpan={2}
								className="border-r border-b px-3.5 py-2.5 text-left align-bottom"
							>
								<span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
									Módulo
								</span>
							</th>
							<th className="border-r-2 border-b border-primary bg-primary/5 px-2.5 pt-2 pb-1 text-center">
								<span className="text-[10.5px] font-bold tracking-wide text-primary uppercase">
									Acceso base
								</span>
							</th>
							<th
								colSpan={3}
								className="border-b bg-muted/50 px-2.5 pt-2 pb-1 text-center"
							>
								<span className="text-[10.5px] font-bold tracking-wide text-muted-foreground uppercase">
									Acciones · requieren Ver
								</span>
							</th>
						</tr>
						<tr>
							<th className="border-r-2 border-b border-primary bg-primary/5 px-2.5 pt-1 pb-2.5 text-center">
								<span className="text-xs font-bold text-primary">Ver</span>
							</th>
							{SECONDARY_ACTIONS.map((action) => (
								<th
									key={action}
									className="border-b bg-muted/50 px-2.5 pt-1 pb-2.5 text-center"
								>
									<span className="text-xs font-semibold text-muted-foreground">
										{ACTION_LABELS[action]}
									</span>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{APP_MODULES.map((module) => {
							const actions = findEntry(module);
							return (
								<tr key={module} className="border-t">
									<td className="border-r px-3.5 py-2.5 font-medium">
										{MODULE_LABELS[module]}
									</td>
									<td className="border-r-2 border-primary bg-primary/5 px-2.5 py-2.5 text-center">
										<Switch
											checked={actions.ver}
											onCheckedChange={() => onToggle(module, "ver")}
											disabled={disabled}
										/>
									</td>
									{SECONDARY_ACTIONS.map((action) => (
										<td
											key={action}
											className="bg-muted/50 px-2.5 py-2.5 text-center"
										>
											<Switch
												checked={actions[action]}
												onCheckedChange={() => onToggle(module, action)}
												disabled={disabled}
											/>
										</td>
									))}
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Acordeón — móvil */}
			<div className="flex flex-col gap-2 md:hidden">
				{APP_MODULES.map((module) => {
					const actions = findEntry(module);
					const isExpanded = expandedModule === module;
					return (
						<div
							key={module}
							className="overflow-hidden rounded-lg border bg-card"
						>
							<button
								type="button"
								onClick={() => setExpandedModule(isExpanded ? null : module)}
								className="flex w-full cursor-pointer items-center justify-between gap-2.5 px-3.5 py-3 text-left"
							>
								<div className="min-w-0">
									<div className="text-sm font-semibold">
										{MODULE_LABELS[module]}
									</div>
									<div className="mt-0.5 text-xs text-muted-foreground">
										{summarize(actions)}
									</div>
								</div>
								<ChevronDown
									className={cn(
										"size-4 shrink-0 text-muted-foreground transition-transform",
										isExpanded && "rotate-180",
									)}
								/>
							</button>

							{isExpanded && (
								<div className="flex flex-col gap-2.5 px-3.5 pb-3.5">
									<div className="flex items-center justify-between gap-2.5 rounded-md border border-primary bg-primary/5 px-3 py-2.5">
										<div>
											<div className="text-sm font-bold text-primary">Ver</div>
											<div className="text-[11px] text-primary/85">
												Acceso base al módulo
											</div>
										</div>
										<Switch
											checked={actions.ver}
											onCheckedChange={() => onToggle(module, "ver")}
											disabled={disabled}
										/>
									</div>

									<div className="flex gap-2.5">
										<div className="ml-[11px] w-px shrink-0 bg-border" />
										<div className="flex min-w-0 flex-1 flex-col gap-2">
											{SECONDARY_ACTIONS.map((action) => (
												<div
													key={action}
													className="flex items-center justify-between gap-2.5"
												>
													<span
														className={cn(
															"text-sm",
															actions.ver
																? "text-foreground/80"
																: "text-muted-foreground",
														)}
													>
														{ACTION_LABELS[action]}
													</span>
													<Switch
														checked={actions[action]}
														onCheckedChange={() => onToggle(module, action)}
														disabled={disabled}
													/>
												</div>
											))}
										</div>
									</div>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
