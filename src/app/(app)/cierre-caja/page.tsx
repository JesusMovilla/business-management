import { cashClosingRepository } from "@/data/repositories/cash-closing-repository";
import { CashClosingTable } from "@/modules/cierre-caja/components/cash-closing-table";

// Los cierres de caja viven en Postgres real, no en un snapshot estático: renderizar por request.
export const dynamic = "force-dynamic";

export default async function CierreCajaPage() {
	const cashClosings = await cashClosingRepository.listAll();

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-semibold">Cierre de caja</h1>
				<p className="text-muted-foreground text-sm">
					Registra las ventas del día y concilia el ingreso esperado contra el
					dinero real.
				</p>
			</div>
			<CashClosingTable cashClosings={cashClosings} />
		</div>
	);
}
