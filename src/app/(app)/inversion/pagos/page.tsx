import { PageHeader } from "@/components/layout/page-header";
import { investmentGroupRepository } from "@/data/repositories/investment-group-repository";
import { profitPayoutRepository } from "@/data/repositories/profit-payout-repository";
import { ProfitPayoutTable } from "@/modules/inversion/components/profit-payout-table";

export const dynamic = "force-dynamic";

export default async function InversionPagosPage() {
	const [payouts, groups] = await Promise.all([
		profitPayoutRepository.list(),
		investmentGroupRepository.list(),
	]);

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Pagos a grupos"
				description="Bitácora de cuándo se le paga la ganancia repartida a cada grupo de socios."
				backHref="/inversion"
			/>
			<ProfitPayoutTable initialPayouts={payouts} groups={groups} />
		</div>
	);
}
