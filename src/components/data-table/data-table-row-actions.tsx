"use client";

import type { LucideIcon } from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppModule, PermissionAction } from "@/types";

export interface RowAction {
	label: string;
	icon?: LucideIcon;
	onClick?: () => void;
	href?: string;
	variant?: "default" | "destructive";
	permission?: { module: AppModule; action: PermissionAction };
}

interface DataTableRowActionsProps {
	actions: RowAction[];
}

/**
 * Columna de acciones por fila: trigger `MoreHorizontal` + dropdown, con soporte para
 * acciones como link (`href`), destructivas (`variant="destructive"`) y con permiso
 * (`permission`, envuelve el item en `PermissionGuard`). Detiene la propagación del click
 * para no disparar el `onRowClick` de la fila.
 */
export function DataTableRowActions({ actions }: DataTableRowActionsProps) {
	if (!actions.length) return null;

	const stop = (event: MouseEvent) => event.stopPropagation();

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: stops row-click propagation, the actual control is the button below
		// biome-ignore lint/a11y/useKeyWithClickEvents: no keyboard interaction needed, click-only propagation guard
		<div onClick={stop} className="flex justify-end">
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button variant="ghost" size="icon-sm">
							<MoreHorizontal className="size-4" />
						</Button>
					}
				/>
				<DropdownMenuContent align="end">
					{actions.map((action) =>
						wrapWithPermission(
							action,
							<DropdownMenuItem
								key={action.label}
								variant={action.variant}
								onClick={action.onClick}
								render={action.href ? <Link href={action.href} /> : undefined}
							>
								{action.icon && <action.icon className="size-4" />}
								{action.label}
							</DropdownMenuItem>,
						),
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

function wrapWithPermission(action: RowAction, node: ReactNode) {
	if (!action.permission) return node;
	return (
		<PermissionGuard
			key={action.label}
			module={action.permission.module}
			action={action.permission.action}
		>
			{node}
		</PermissionGuard>
	);
}
