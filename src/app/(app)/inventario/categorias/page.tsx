import { CategoryManager } from "@/modules/inventario/components/category-manager";

export default function CategoriasInventarioPage() {
	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-semibold">Categorías</h1>
				<p className="text-muted-foreground text-sm">
					Gestiona las categorías de productos.
				</p>
			</div>
			<CategoryManager />
		</div>
	);
}
