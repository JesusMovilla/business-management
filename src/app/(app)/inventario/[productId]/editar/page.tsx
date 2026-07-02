import { ProductEditForm } from "@/modules/inventario/components/product-edit-form";

export default async function EditarProductoPage({
	params,
}: {
	params: Promise<{ productId: string }>;
}) {
	const { productId } = await params;
	return <ProductEditForm productId={productId} />;
}
