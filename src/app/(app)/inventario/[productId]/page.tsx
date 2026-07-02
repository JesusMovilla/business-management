import { ProductDetail } from "@/modules/inventario/components/product-detail";

export default async function ProductDetailPage({
	params,
}: {
	params: Promise<{ productId: string }>;
}) {
	const { productId } = await params;
	return <ProductDetail productId={productId} />;
}
