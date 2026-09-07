import { RouteGuard } from "@/components/guards/route-guard";
import { cashClosingRepository } from "@/data/repositories/cash-closing-repository";
import { productRepository } from "@/data/repositories/product-repository";
import { CashClosingDraftView } from "@/modules/cierre-caja/components/cash-closing-draft-view";
import { StartCashClosingDraft } from "@/modules/cierre-caja/components/start-cash-closing-draft";

// El borrador en curso vive en Postgres real: renderizar por request, no cachear.
export const dynamic = "force-dynamic";

export default async function NuevoCierrePage() {
	const [draft, products] = await Promise.all([
		cashClosingRepository.getOpenDraft(),
		productRepository.listWithQuantity(),
	]);
	const activeProducts = products.filter((product) => product.active);

	return (
		<RouteGuard module="cierre-caja" action="crear">
			{draft ? (
				<CashClosingDraftView draft={draft} products={activeProducts} />
			) : (
				<StartCashClosingDraft />
			)}
		</RouteGuard>
	);
}
