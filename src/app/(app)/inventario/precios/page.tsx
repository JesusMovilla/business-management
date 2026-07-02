import { PriceMarginTable } from "@/modules/inventario/components/price-margin-table";

export default function PreciosInventarioPage() {
	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-semibold">Precios y márgenes</h1>
				<p className="text-muted-foreground text-sm">
					Analiza el costo, precio de venta y margen de cada producto.
				</p>
			</div>
			<PriceMarginTable />
		</div>
	);
}
