"use client";

import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { StockStatus } from "@/types";
import type { ProductFilters } from "../hooks/use-product-filters";
import { useCategories, useSuppliers } from "../hooks/use-products";
import { STOCK_STATUS_LABELS } from "../lib/stock-status";

interface ProductFiltersBarProps {
	filters: ProductFilters;
	onChange: (filters: ProductFilters) => void;
}

const STOCK_STATUSES: StockStatus[] = ["ok", "bajo", "critico"];

export function ProductFiltersBar({
	filters,
	onChange,
}: ProductFiltersBarProps) {
	const categories = useCategories();
	const suppliers = useSuppliers();

	return (
		<div className="flex flex-wrap items-center gap-2">
			<Input
				placeholder="Buscar por nombre, SKU o marca..."
				value={filters.search}
				onChange={(event) =>
					onChange({ ...filters, search: event.target.value })
				}
				className="max-w-xs"
			/>
			<Select
				value={filters.categoryId}
				onValueChange={(value) =>
					onChange({ ...filters, categoryId: value as string })
				}
			>
				<SelectTrigger size="sm" className="w-[160px]">
					<SelectValue placeholder="Categoría" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">Todas las categorías</SelectItem>
					{categories.map((category) => (
						<SelectItem key={category.id} value={category.id}>
							{category.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Select
				value={filters.supplierId}
				onValueChange={(value) =>
					onChange({ ...filters, supplierId: value as string })
				}
			>
				<SelectTrigger size="sm" className="w-[160px]">
					<SelectValue placeholder="Proveedor" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">Todos los proveedores</SelectItem>
					{suppliers.map((supplier) => (
						<SelectItem key={supplier.id} value={supplier.id}>
							{supplier.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Select
				value={filters.stockStatus}
				onValueChange={(value) =>
					onChange({ ...filters, stockStatus: value as StockStatus | "all" })
				}
			>
				<SelectTrigger size="sm" className="w-[160px]">
					<SelectValue placeholder="Estado de stock" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">Todos los estados</SelectItem>
					{STOCK_STATUSES.map((status) => (
						<SelectItem key={status} value={status}>
							{STOCK_STATUS_LABELS[status]}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
