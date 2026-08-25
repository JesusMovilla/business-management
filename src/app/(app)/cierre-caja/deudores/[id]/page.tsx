import { notFound } from "next/navigation";
import { debtorRepository } from "@/data/repositories/debtor-repository";
import { DebtorDetail } from "@/modules/cierre-caja/components/debtor-detail";

export default async function DebtorDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const debtor = await debtorRepository.getById(id);
	if (!debtor) notFound();

	return <DebtorDetail initialDebtor={debtor} />;
}
