"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import type { Debtor } from "@/types";
import { searchDebtorsAction } from "../debtor-actions";

export interface DebtorPickerValue {
	debtorId?: string;
	newDebtorName?: string;
}

interface DebtorPickerProps {
	displayName: string;
	onChange: (value: DebtorPickerValue & { displayName: string }) => void;
	disabled?: boolean;
	placeholder?: string;
}

/**
 * Selector de deudores: al enfocar muestra los deudores existentes (con su balance, para
 * desambiguar dos personas con el mismo nombre); escribir filtra esa lista. Si el texto escrito
 * no coincide exactamente con ninguno, aparece la opción "Crear '<nombre>' como nuevo deudor" —
 * mismo espíritu que crear un producto nuevo al no encontrarlo en un selector existente. Elegir
 * una opción (existente o "crear nuevo") es lo único que resuelve la fila; solo escribir sin
 * seleccionar no alcanza. No hay un componente Combobox/Command en el proyecto
 * (`src/components/ui/` solo tiene `select`, sin creación inline) — se construye con `Input` +
 * lista desplegable simple, sin agregar dependencias nuevas.
 *
 * @example
 * <DebtorPicker
 *   displayName={row.displayName}
 *   onChange={(value) => updateRow(row.id, value)}
 * />
 */
export function DebtorPicker({
	displayName,
	onChange,
	disabled,
	placeholder = "Selecciona o escribe un nombre",
}: DebtorPickerProps) {
	const [query, setQuery] = useState(displayName);
	const [results, setResults] = useState<Debtor[]>([]);
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	// Busca en cada apertura y en cada tecleo, incluso con el campo vacío — el foco por sí solo ya
	// debe mostrar la lista de deudores existentes, como un selector normal.
	useEffect(() => {
		if (!open) return;
		const timeout = setTimeout(() => {
			void searchDebtorsAction(query.trim()).then((result) => {
				setResults(Array.isArray(result) ? result : []);
			});
		}, 200);
		return () => clearTimeout(timeout);
	}, [query, open]);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (!containerRef.current?.contains(event.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const trimmedQuery = query.trim();
	const hasExactMatch = results.some(
		(debtor) => debtor.name.toLowerCase() === trimmedQuery.toLowerCase(),
	);
	const showCreateOption = trimmedQuery.length > 0 && !hasExactMatch;

	return (
		<div ref={containerRef} className="relative">
			<Input
				value={query}
				disabled={disabled}
				placeholder={placeholder}
				onFocus={() => setOpen(true)}
				onChange={(event) => {
					const nextValue = event.target.value;
					setQuery(nextValue);
					setOpen(true);
					// Escribir por sí solo no resuelve la fila — hay que elegir un resultado o la
					// opción "Crear..." de abajo, igual que un selector.
					onChange({
						debtorId: undefined,
						newDebtorName: undefined,
						displayName: nextValue,
					});
				}}
			/>
			{open && (results.length > 0 || showCreateOption) && (
				<div className="bg-popover text-popover-foreground absolute z-10 mt-1 w-full rounded-md border shadow-md">
					{results.map((debtor) => (
						<button
							key={debtor.id}
							type="button"
							className="hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm first:rounded-t-md"
							onClick={() => {
								setQuery(debtor.name);
								setOpen(false);
								onChange({
									debtorId: debtor.id,
									newDebtorName: undefined,
									displayName: debtor.name,
								});
							}}
						>
							<span>{debtor.name}</span>
							<span className="text-muted-foreground text-xs">
								{debtor.balance > 0
									? `Debe ${formatCurrency(debtor.balance)}`
									: "Al día"}
							</span>
						</button>
					))}
					{showCreateOption && (
						<button
							type="button"
							className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 border-t px-3 py-2 text-left text-sm last:rounded-b-md"
							onClick={() => {
								setOpen(false);
								onChange({
									debtorId: undefined,
									newDebtorName: trimmedQuery,
									displayName: trimmedQuery,
								});
							}}
						>
							<Plus className="size-3.5" />
							Crear &quot;{trimmedQuery}&quot; como nuevo deudor
						</button>
					)}
				</div>
			)}
		</div>
	);
}
