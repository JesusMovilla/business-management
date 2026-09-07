"use client";

import type { FilterFn } from "@tanstack/react-table";
import { Download } from "lucide-react";
import { useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { downloadCsv, toCsv } from "@/lib/csv";
import { formatPercent } from "@/lib/format";
import {
	buildProductProfitabilityColumns,
	type ProductProfitabilityRow,
} from "./product-profitability-columns";

const globalFilterFn: FilterFn<ProductProfitabilityRow> = (
	row,
	_columnId,
	value,
) => {
	const search = String(value).toLowerCase();
	return (
		row.original.name.toLowerCase().includes(search) ||
		row.original.categoryName.toLowerCase().includes(search)
	);
};

/** Tabla exportable de rentabilidad por producto (sección 4 del plan): ABC por ventas y por
 * ganancia por separado, porque un producto puede ser A en ingresos y C en rentabilidad. */
export function ProductProfitabilityTable({
	data,
}: {
	data: ProductProfitabilityRow[];
}) {
	const columns = useMemo(() => buildProductProfitabilityColumns(), []);

	const handleExportCsv = () => {
		const header = [
			"Producto",
			"Presentación",
			"Categoría",
			"Unidades vendidas",
			"Precio venta promedio",
			"Precio de lista actual",
			"Ventas",
			"Costo total",
			"Ganancia bruta",
			"Margen %",
			"% de ventas",
			"% de ganancia",
			"Inventario disponible",
			"Última venta",
			"ABC ventas",
			"ABC ganancia",
		];
		const rows = data.map((row) => [
			row.name,
			row.presentation,
			row.categoryName,
			String(row.unidadesVendidas),
			row.precioVentaPromedio === null ? "" : String(row.precioVentaPromedio),
			row.precioListaActual === null ? "" : String(row.precioListaActual),
			String(row.ventas),
			String(row.costoTotal),
			String(row.gananciaBruta),
			row.margenPercent === null ? "" : formatPercent(row.margenPercent),
			formatPercent(row.participacionVentasPercent),
			formatPercent(row.participacionGananciaPercent),
			String(row.inventarioDisponible),
			row.ultimaVenta,
			row.abcVentas,
			row.abcGanancia,
		]);
		downloadCsv(
			`rentabilidad-por-producto-${new Date().toISOString().slice(0, 10)}.csv`,
			toCsv([header, ...rows]),
		);
	};

	return (
		<DataTable
			columns={columns}
			data={data}
			searchPlaceholder="Buscar producto o categoría..."
			globalFilterFn={globalFilterFn}
			emptyMessage="No hay ventas registradas en este período."
			toolbarActions={
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleExportCsv}
					disabled={data.length === 0}
				>
					<Download className="size-4" />
					Exportar CSV
				</Button>
			}
		/>
	);
}
