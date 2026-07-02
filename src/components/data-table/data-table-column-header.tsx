"use client";

import type { Column } from "@tanstack/react-table";
import {
	ArrowDown,
	ArrowUp,
	ChevronsUpDown,
	EyeOff,
	Filter,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ColumnHeaderFilter =
	| { type: "select"; options: { label: string; value: string }[] }
	| { type: "text" };

interface DataTableColumnHeaderProps<TData, TValue> {
	column: Column<TData, TValue>;
	title: string;
	filter?: ColumnHeaderFilter;
	className?: string;
}

/**
 * Título de columna con menú de orden/filtro/visibilidad, usado como `header` en las
 * columnas de `DataTable`. Si la columna no ordena, no filtra y no se puede ocultar,
 * se renderiza el título plano sin dropdown.
 */
export function DataTableColumnHeader<TData, TValue>({
	column,
	title,
	filter,
	className,
}: DataTableColumnHeaderProps<TData, TValue>) {
	const canSort = column.getCanSort();
	const canHide = column.getCanHide();

	if (!canSort && !filter && !canHide) {
		return <span className={className}>{title}</span>;
	}

	const sorted = column.getIsSorted();
	const filterValue = column.getFilterValue();
	const hasActiveFilter = Array.isArray(filterValue)
		? filterValue.length > 0
		: !!filterValue;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						size="sm"
						className={cn(
							"-ml-2 h-7 gap-1 px-2 data-[state=open]:bg-muted",
							className,
						)}
					/>
				}
			>
				<span>{title}</span>
				{hasActiveFilter && <Filter className="size-3 text-primary" />}
				{sorted === "asc" ? (
					<ArrowUp className="size-3.5" />
				) : sorted === "desc" ? (
					<ArrowDown className="size-3.5" />
				) : canSort ? (
					<ChevronsUpDown className="size-3.5 text-muted-foreground" />
				) : null}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="min-w-48">
				{canSort && (
					<>
						<DropdownMenuItem onClick={() => column.toggleSorting(false)}>
							<ArrowUp className="size-4" />
							Ordenar ascendente
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => column.toggleSorting(true)}>
							<ArrowDown className="size-4" />
							Ordenar descendente
						</DropdownMenuItem>
					</>
				)}
				{filter && (
					<>
						{canSort && <DropdownMenuSeparator />}
						{filter.type === "select" ? (
							<SelectFilter column={column} options={filter.options} />
						) : (
							<TextFilter column={column} />
						)}
					</>
				)}
				{canHide && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
							<EyeOff className="size-4" />
							Ocultar columna
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function SelectFilter<TData, TValue>({
	column,
	options,
}: {
	column: Column<TData, TValue>;
	options: { label: string; value: string }[];
}) {
	const selected = new Set((column.getFilterValue() as string[]) ?? []);

	const toggle = (value: string, checked: boolean) => {
		const next = new Set(selected);
		if (checked) next.add(value);
		else next.delete(value);
		column.setFilterValue(next.size ? Array.from(next) : undefined);
	};

	return (
		<DropdownMenuGroup>
			<DropdownMenuLabel>Filtrar</DropdownMenuLabel>
			{options.map((option) => (
				<DropdownMenuCheckboxItem
					key={option.value}
					checked={selected.has(option.value)}
					onCheckedChange={(checked) => toggle(option.value, checked)}
				>
					{option.label}
				</DropdownMenuCheckboxItem>
			))}
		</DropdownMenuGroup>
	);
}

function TextFilter<TData, TValue>({
	column,
}: {
	column: Column<TData, TValue>;
}) {
	const [value, setValue] = useState((column.getFilterValue() as string) ?? "");

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: stops keydown propagation so typing doesn't trigger menu keyboard nav, the actual control is the input below
		<div className="p-1" onKeyDown={(event) => event.stopPropagation()}>
			<Input
				autoFocus
				placeholder="Filtrar..."
				value={value}
				onChange={(event) => {
					setValue(event.target.value);
					column.setFilterValue(event.target.value || undefined);
				}}
				className="h-7"
			/>
		</div>
	);
}
