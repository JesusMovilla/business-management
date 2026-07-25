import { PageHeader } from "@/components/layout/page-header";
import { expenseCategoryRepository } from "@/data/repositories/expense-category-repository";
import { ExpenseCategoryManager } from "@/modules/gastos/components/expense-category-manager";

export const dynamic = "force-dynamic";

export default async function GastosCategoriasPage() {
	const categories = await expenseCategoryRepository.list();

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Categorías de gasto"
				description="Gestiona las categorías y subcategorías usadas para clasificar los gastos."
				backHref="/gastos"
			/>
			<ExpenseCategoryManager initialCategories={categories} />
		</div>
	);
}
