import { PageHeader } from "@/components/layout/page-header";
import { CategoryManager } from "@/modules/inventario/components/category-manager";

export default function CategoriasInventarioPage() {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Categorías"
				description="Gestiona las categorías de productos."
				backHref="/inventario"
			/>
			<CategoryManager />
		</div>
	);
}
