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
	/** Deshabilita esta acción puntual — ej. mientras su mutación está en curso. */
	disabled?: boolean;
}

interface DataTableRowActionsProps {
	actions: RowAction[];
}

const stopPropagation = (event: MouseEvent) => event.stopPropagation();

/**
 * Columna de acciones por fila: trigger `MoreHorizontal` + dropdown, con soporte para
 * acciones como link (`href`), destructivas (`variant="destructive"`) y con permiso
 * (`permission`, envuelve el item en `PermissionGuard`). El trigger y el contenido del
 * dropdown detienen la propagación del click para no disparar el `onRowClick` de la fila:
 * aunque el contenido se renderiza en un portal (fuera de la fila en el DOM), React sigue
 * propagando el evento según el árbol de componentes, no el DOM, así que un click en un item
 * burbujea hasta el `onClick` de la `TableRow` si no se detiene acá.
 */
export function DataTableRowActions({ actions }: DataTableRowActionsProps) {
	if (!actions.length) return null;

	return (
		<div className="flex justify-start">
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button variant="ghost" size="icon-sm" onClick={stopPropagation}>
							<MoreHorizontal className="size-4" />
						</Button>
					}
				/>
				<DropdownMenuContent
					align="start"
					className="min-w-44"
					onClick={stopPropagation}
				>
					{actions.map((action) =>
						wrapWithPermission(
							action,
							<DropdownMenuItem
								key={action.label}
								variant={action.variant}
								onClick={action.onClick}
								disabled={action.disabled}
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
