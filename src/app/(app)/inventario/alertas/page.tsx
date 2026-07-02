import { LowStockAlertList } from "@/modules/inventario/components/low-stock-alert-list";

export default function AlertasInventarioPage() {
	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-semibold">Alertas de stock</h1>
				<p className="text-muted-foreground text-sm">
					Productos con existencias bajas o agotadas que requieren reposición.
				</p>
			</div>
			<LowStockAlertList />
		</div>
	);
}
