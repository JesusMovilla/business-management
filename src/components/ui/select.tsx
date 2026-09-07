"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import {
	CheckIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	SearchIcon,
} from "lucide-react";
import type * as React from "react";
import {
	Children,
	cloneElement,
	createContext,
	isValidElement,
	useContext,
	useId,
	useMemo,
	useState,
} from "react";
import { cn } from "@/lib/utils";

interface SelectSearchContextValue {
	searchable: boolean;
	query: string;
	setQuery: (query: string) => void;
}

const SelectSearchContext = createContext<SelectSearchContextValue>({
	searchable: false,
	query: "",
	setQuery: () => {},
});

function getTextContent(node: React.ReactNode): string {
	if (node == null || typeof node === "boolean") return "";
	if (typeof node === "string" || typeof node === "number") return String(node);
	if (Array.isArray(node)) return node.map(getTextContent).join(" ");
	if (isValidElement(node)) {
		return getTextContent(
			(node.props as { children?: React.ReactNode }).children,
		);
	}
	return "";
}

function normalizeSearchText(value: string) {
	return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/**
 * Recorre `children` filtrando los `SelectItem` cuyo texto no coincide con `query`. Los
 * `SelectGroup` se conservan solo si les queda al menos un ítem visible.
 */
function filterSelectChildrenByQuery(
	children: React.ReactNode,
	query: string,
): React.ReactNode {
	const normalizedQuery = normalizeSearchText(query);
	if (!normalizedQuery) return children;

	const filterNode = (node: React.ReactNode): React.ReactNode => {
		if (!isValidElement(node)) return node;
		if (node.type === SelectItem) {
			const props = node.props as { children?: React.ReactNode };
			const text = normalizeSearchText(getTextContent(props.children));
			return text.includes(normalizedQuery) ? node : null;
		}
		if (node.type === SelectGroup) {
			const props = node.props as { children?: React.ReactNode };
			const filteredChildren = Children.toArray(props.children).flatMap(
				(child) => {
					const filtered = filterNode(child);
					return filtered ? [filtered] : [];
				},
			);
			const hasItem = filteredChildren.some(
				(child) => isValidElement(child) && child.type === SelectItem,
			);
			if (!hasItem) return null;
			return cloneElement(
				node as React.ReactElement<{ children?: React.ReactNode }>,
				{},
				filteredChildren,
			);
		}
		return node;
	};

	return Children.toArray(children).flatMap((child) => {
		const filtered = filterNode(child);
		return filtered ? [filtered] : [];
	});
}

/**
 * A diferencia de Radix, Base UI no infiere el label del ítem seleccionado a partir de sus
 * children — `Select.Value` muestra el `value` crudo salvo que `Select.Root` reciba `items`
 * (mapa value → label). Recorremos los `children` para armar ese mapa automáticamente a partir
 * de los `SelectItem` declarados, así ningún lugar que use `Select` tiene que pasar `items` a mano.
 */
function collectSelectItemLabels(
	node: React.ReactNode,
	acc: Record<string, React.ReactNode>,
) {
	Children.forEach(node, (child) => {
		if (!isValidElement(child)) return;
		const props = child.props as {
			value?: string;
			children?: React.ReactNode;
		};
		if (child.type === SelectItem && props.value !== undefined) {
			acc[props.value] = props.children;
			return;
		}
		if (props.children) collectSelectItemLabels(props.children, acc);
	});
}

/**
 * Select accesible basado en Base UI. `SelectTrigger` acepta `size` ("sm" | "default").
 * `searchable` agrega un buscador dentro de `SelectContent` para filtrar las opciones — útil
 * en selects con muchas opciones (ej. productos); se deja deshabilitado por defecto porque en
 * selects cortos (categorías, roles, etc.) solo agrega ruido visual.
 */
function Select({
	children,
	items,
	searchable = false,
	onOpenChange,
	...props
}: SelectPrimitive.Root.Props<string> & { searchable?: boolean }) {
	const [query, setQuery] = useState("");
	const resolvedItems = useMemo(() => {
		if (items) return items;
		const collected: Record<string, React.ReactNode> = {};
		collectSelectItemLabels(children, collected);
		return collected;
	}, [children, items]);
	const searchContextValue = useMemo(
		() => ({ searchable, query, setQuery }),
		[searchable, query],
	);
	return (
		<SelectPrimitive.Root
			items={resolvedItems}
			onOpenChange={(open, eventDetails) => {
				if (open) setQuery("");
				onOpenChange?.(open, eventDetails);
			}}
			{...props}
		>
			<SelectSearchContext.Provider value={searchContextValue}>
				{children}
			</SelectSearchContext.Provider>
		</SelectPrimitive.Root>
	);
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
	return (
		<SelectPrimitive.Group
			data-slot="select-group"
			className={cn("scroll-my-1 p-1", className)}
			{...props}
		/>
	);
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
	return (
		<SelectPrimitive.Value
			data-slot="select-value"
			className={cn("flex flex-1 text-left", className)}
			{...props}
		/>
	);
}

function SelectTrigger({
	className,
	size = "default",
	children,
	...props
}: SelectPrimitive.Trigger.Props & {
	size?: "sm" | "default";
}) {
	return (
		<SelectPrimitive.Trigger
			data-slot="select-trigger"
			data-size={size}
			className={cn(
				"flex w-fit cursor-pointer items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...props}
		>
			{children}
			<SelectPrimitive.Icon
				render={
					<ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
				}
			/>
		</SelectPrimitive.Trigger>
	);
}

/**
 * Si `children` no tiene ítems (ej. lista dinámica todavía vacía), muestra "No hay opciones
 * disponibles." en vez de un menú desplegable vacío. `alignItemWithTrigger` se deja en `false`
 * por defecto para que el menú siempre se abra debajo del trigger (con `true`, Base UI alinea el
 * ítem seleccionado sobre el trigger, lo que hace parecer que el select no se abrió).
 */
function SelectContent({
	className,
	children,
	side = "bottom",
	sideOffset = 4,
	align = "center",
	alignOffset = 0,
	alignItemWithTrigger = false,
	...props
}: SelectPrimitive.Popup.Props &
	Pick<
		SelectPrimitive.Positioner.Props,
		"align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
	>) {
	const { searchable, query, setQuery } = useContext(SelectSearchContext);
	const searchInputId = useId();
	const visibleChildren = searchable
		? filterSelectChildrenByQuery(children, query)
		: children;
	const isEmpty =
		Children.toArray(visibleChildren).filter(Boolean).length === 0;
	return (
		<SelectPrimitive.Portal>
			<SelectPrimitive.Positioner
				side={side}
				sideOffset={sideOffset}
				align={align}
				alignOffset={alignOffset}
				alignItemWithTrigger={alignItemWithTrigger}
				className="isolate z-50"
			>
				<SelectPrimitive.Popup
					data-slot="select-content"
					data-align-trigger={alignItemWithTrigger}
					className={cn(
						"relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
						className,
					)}
					{...props}
				>
					{searchable && (
						<div className="sticky top-0 z-10 border-b bg-popover p-1.5">
							<div className="relative">
								<label htmlFor={searchInputId} className="sr-only">
									Buscar
								</label>
								<SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
								<input
									id={searchInputId}
									autoFocus
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									onKeyDown={(event) => {
										if (event.key === "ArrowDown") {
											event.preventDefault();
											event.currentTarget
												.closest("[data-slot=select-content]")
												?.querySelector<HTMLElement>("[data-slot=select-item]")
												?.focus();
											return;
										}
										// El popup de Base UI hace typeahead (mueve el foco al ítem que empieza
										// con la tecla presionada) escuchando keydown en el propio popup. Sin
										// cortar la propagación, cada letra escrita en el buscador se lo roba
										// el foco apenas hay una coincidencia.
										if (event.key !== "Escape" && event.key !== "Tab") {
											event.stopPropagation();
										}
									}}
									placeholder="Buscar..."
									className="h-7 w-full rounded-md border border-input bg-transparent pr-2 pl-7 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring"
								/>
							</div>
						</div>
					)}
					<SelectScrollUpButton />
					<SelectPrimitive.List>
						{isEmpty ? (
							<div className="px-2 py-4 text-center text-muted-foreground text-sm">
								{searchable && query
									? "No se encontraron resultados."
									: "No hay opciones disponibles."}
							</div>
						) : (
							visibleChildren
						)}
					</SelectPrimitive.List>
					<SelectScrollDownButton />
				</SelectPrimitive.Popup>
			</SelectPrimitive.Positioner>
		</SelectPrimitive.Portal>
	);
}

function SelectLabel({
	className,
	...props
}: SelectPrimitive.GroupLabel.Props) {
	return (
		<SelectPrimitive.GroupLabel
			data-slot="select-label"
			className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)}
			{...props}
		/>
	);
}

function SelectItem({
	className,
	children,
	...props
}: SelectPrimitive.Item.Props) {
	return (
		<SelectPrimitive.Item
			data-slot="select-item"
			className={cn(
				"relative flex w-full cursor-pointer items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
				className,
			)}
			{...props}
		>
			<SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
				{children}
			</SelectPrimitive.ItemText>
			<SelectPrimitive.ItemIndicator
				render={
					<span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
				}
			>
				<CheckIcon className="pointer-events-none" />
			</SelectPrimitive.ItemIndicator>
		</SelectPrimitive.Item>
	);
}

function SelectSeparator({
	className,
	...props
}: SelectPrimitive.Separator.Props) {
	return (
		<SelectPrimitive.Separator
			data-slot="select-separator"
			className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
			{...props}
		/>
	);
}

function SelectScrollUpButton({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
	return (
		<SelectPrimitive.ScrollUpArrow
			data-slot="select-scroll-up-button"
			className={cn(
				"top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...props}
		>
			<ChevronUpIcon />
		</SelectPrimitive.ScrollUpArrow>
	);
}

function SelectScrollDownButton({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
	return (
		<SelectPrimitive.ScrollDownArrow
			data-slot="select-scroll-down-button"
			className={cn(
				"bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...props}
		>
			<ChevronDownIcon />
		</SelectPrimitive.ScrollDownArrow>
	);
}

export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectScrollDownButton,
	SelectScrollUpButton,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
};
