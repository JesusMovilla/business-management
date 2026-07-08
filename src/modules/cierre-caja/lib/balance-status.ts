import type { BalanceStatus } from "@/types";

export function getBalanceStatus(difference: number): BalanceStatus {
	if (difference > 0) return "sobrante";
	if (difference < 0) return "faltante";
	return "ok";
}

export const BALANCE_STATUS_LABELS: Record<BalanceStatus, string> = {
	ok: "Cuadra",
	sobrante: "Sobrante",
	faltante: "Faltante",
};
