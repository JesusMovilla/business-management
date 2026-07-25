import { PageHeader } from "@/components/layout/page-header";
import { LowStockAlertList } from "@/modules/inventario/components/low-stock-alert-list";

export default function AlertasInventarioPage() {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Alertas de stock"
				description="Productos con existencias bajas o agotadas que requieren reposición."
				backHref="/inventario"
			/>
			<LowStockAlertList />
		</div>
	);
}
