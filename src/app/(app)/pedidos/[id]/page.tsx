import { notFound } from "next/navigation";
import { expenseRepository } from "@/data/repositories/expense-repository";
import { productRepository } from "@/data/repositories/product-repository";
import { purchaseOrderRepository } from "@/data/repositories/purchase-order-repository";
import { userRepository } from "@/data/repositories/user-repository";
import { PurchaseOrderDetail } from "@/modules/pedidos/components/purchase-order-detail";

export default async function PedidoDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const [order, products, users] = await Promise.all([
		purchaseOrderRepository.getById(id),
		productRepository.listWithQuantity(),
		userRepository.list(),
	]);

	if (!order) notFound();

	const expense = order.expenseId
		? await expenseRepository.getById(order.expenseId)
		: null;

	const nameById = new Map(users.map((user) => [user.id, user.fullName]));

	return (
		<PurchaseOrderDetail
			order={order}
			products={products}
			expense={expense}
			createdByName={nameById.get(order.createdBy) ?? "—"}
			reversedByName={
				order.reversedBy ? (nameById.get(order.reversedBy) ?? "—") : undefined
			}
		/>
	);
}
