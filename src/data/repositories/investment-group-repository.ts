import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { investmentGroupMembers, investmentGroups } from "@/db/schema";
import type { InvestmentGroup, NewInvestmentGroupInput } from "@/types";

function toGroup(
	row: typeof investmentGroups.$inferSelect,
	memberUserIds: string[],
): InvestmentGroup {
	return {
		id: row.id,
		name: row.name,
		status: row.status as InvestmentGroup["status"],
		memberUserIds,
	};
}

export const investmentGroupRepository = {
	async list(): Promise<InvestmentGroup[]> {
		const [groups, members] = await Promise.all([
			db.select().from(investmentGroups),
			db.select().from(investmentGroupMembers),
		]);
		const memberIdsByGroup = new Map<string, string[]>();
		for (const member of members) {
			const list = memberIdsByGroup.get(member.groupId) ?? [];
			list.push(member.userId);
			memberIdsByGroup.set(member.groupId, list);
		}
		return groups.map((group) =>
			toGroup(group, memberIdsByGroup.get(group.id) ?? []),
		);
	},
	async create(input: NewInvestmentGroupInput): Promise<string> {
		const id = crypto.randomUUID();
		await db.transaction(async (tx) => {
			await tx
				.insert(investmentGroups)
				.values({ id, name: input.name, status: input.status });
			if (input.memberUserIds.length > 0) {
				await tx
					.insert(investmentGroupMembers)
					.values(
						input.memberUserIds.map((userId) => ({ groupId: id, userId })),
					);
			}
		});
		return id;
	},
	async update(id: string, patch: NewInvestmentGroupInput): Promise<void> {
		await db.transaction(async (tx) => {
			await tx
				.update(investmentGroups)
				.set({ name: patch.name, status: patch.status })
				.where(eq(investmentGroups.id, id));
			await tx
				.delete(investmentGroupMembers)
				.where(eq(investmentGroupMembers.groupId, id));
			if (patch.memberUserIds.length > 0) {
				await tx
					.insert(investmentGroupMembers)
					.values(
						patch.memberUserIds.map((userId) => ({ groupId: id, userId })),
					);
			}
		});
	},
	async remove(id: string): Promise<void> {
		await db.delete(investmentGroups).where(eq(investmentGroups.id, id));
	},
};
