import { expenseCategoryRepository } from "@/data/repositories/expense-category-repository";
import { ExpenseCategoryManager } from "@/modules/gastos/components/expense-category-manager";

export const dynamic = "force-dynamic";

export default async function GastosCategoriasPage() {
	const categories = await expenseCategoryRepository.list();

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-semibold">Categorías de gasto</h1>
				<p className="text-muted-foreground text-sm">
					Gestiona las categorías y subcategorías usadas para clasificar los
					gastos.
				</p>
			</div>
			<ExpenseCategoryManager initialCategories={categories} />
		</div>
	);
}
