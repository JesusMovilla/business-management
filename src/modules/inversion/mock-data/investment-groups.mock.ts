import type { NewInvestmentGroupInput } from "@/types";

/** Semilla de grupos inversionistas — el único integrante disponible al sembrar es el super admin. */
export function buildInvestmentGroupsMock(
	userId: string,
): (NewInvestmentGroupInput & { id: string })[] {
	return [
		{
			id: "inv-group-a",
			name: "Grupo A",
			status: "activo",
			memberUserIds: [userId],
		},
	];
}
