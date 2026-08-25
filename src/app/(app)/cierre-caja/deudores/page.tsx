import { PageHeader } from "@/components/layout/page-header";
import { debtorRepository } from "@/data/repositories/debtor-repository";
import { DebtorTable } from "@/modules/cierre-caja/components/debtor-table";

// Los deudores viven en Postgres real, no en un snapshot estático: renderizar por request.
export const dynamic = "force-dynamic";

export default async function DeudoresPage() {
	const debtors = await debtorRepository.listAll();

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Deudores"
				description="Seguimiento de a quién se le fio, para cobrar en una futura ocasión."
				backLabel="Volver a cierre de caja"
				backHref="/cierre-caja"
			/>
			<DebtorTable initialDebtors={debtors} />
		</div>
	);
}
