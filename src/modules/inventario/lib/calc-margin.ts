import type { ProductPricing } from "@/types";

export function calcMarginPercent(cost: number, price: number): number {
	if (price <= 0) return 0;
	return ((price - cost) / price) * 100;
}

export function calcRetailMargin(pricing: ProductPricing): number {
	return calcMarginPercent(pricing.cost, pricing.retailPrice);
}

export function calcWholesaleMargin(pricing: ProductPricing): number {
	return calcMarginPercent(pricing.cost, pricing.wholesalePrice);
}

export const LOW_MARGIN_THRESHOLD = 15;

export function isLowMargin(marginPercent: number): boolean {
	return marginPercent < LOW_MARGIN_THRESHOLD;
}
