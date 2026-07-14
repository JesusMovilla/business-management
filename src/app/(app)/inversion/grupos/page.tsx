import { investmentGroupRepository } from "@/data/repositories/investment-group-repository";
import { userRepository } from "@/data/repositories/user-repository";
import { InvestmentGroupTable } from "@/modules/inversion/components/investment-group-table";

export const dynamic = "force-dynamic";

export default async function InversionGruposPage() {
	const [groups, users] = await Promise.all([
		investmentGroupRepository.list(),
		userRepository.list(),
	]);

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-semibold">Grupos inversionistas</h1>
				<p className="text-muted-foreground text-sm">
					Gestiona los grupos y sus integrantes (usuarios del sistema).
				</p>
			</div>
			<InvestmentGroupTable initialGroups={groups} users={users} />
		</div>
	);
}
