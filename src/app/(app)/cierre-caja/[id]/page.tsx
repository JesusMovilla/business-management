import { notFound } from "next/navigation";
import { cashClosingRepository } from "@/data/repositories/cash-closing-repository";
import { productRepository } from "@/data/repositories/product-repository";
import { userRepository } from "@/data/repositories/user-repository";
import { CashClosingDetail } from "@/modules/cierre-caja/components/cash-closing-detail";

export default async function CierreCajaDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const [closing, products, users] = await Promise.all([
		cashClosingRepository.getById(id),
		productRepository.listWithQuantity(),
		userRepository.list(),
	]);

	if (!closing) notFound();

	const nameById = new Map(users.map((user) => [user.id, user.fullName]));

	return (
		<CashClosingDetail
			closing={closing}
			products={products}
			createdByName={nameById.get(closing.createdBy) ?? "—"}
			updatedByName={
				closing.updatedBy ? (nameById.get(closing.updatedBy) ?? "—") : undefined
			}
		/>
	);
}
