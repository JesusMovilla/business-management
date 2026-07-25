import { PageHeader } from "@/components/layout/page-header";
import { PriceMarginTable } from "@/modules/inventario/components/price-margin-table";

export default function PreciosInventarioPage() {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Precios y márgenes"
				description="Analiza el costo, precio de venta y margen de cada producto."
				backHref="/inventario"
			/>
			<PriceMarginTable />
		</div>
	);
}
