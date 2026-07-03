import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { roles } from "@/db/schema";
import type {
	AppModule,
	PermissionAction,
	PermissionTree,
	Role,
} from "@/types";
import { buildEmptyPermissionTree } from "@/types";

function nowIso() {
	return new Date().toISOString();
}

function toRole(row: typeof roles.$inferSelect): Role {
	return { ...row, description: row.description ?? undefined };
}

export const roleRepository = {
	async list(): Promise<Role[]> {
		const rows = await db.select().from(roles);
		return rows.map(toRole);
	},
	async getById(id: string): Promise<Role | undefined> {
		const [row] = await db.select().from(roles).where(eq(roles.id, id));
		return row ? toRole(row) : undefined;
	},
	async create(input: {
		name: string;
		description?: string;
		permissions?: PermissionTree;
	}): Promise<string> {
		const id = crypto.randomUUID();
		const now = nowIso();
		await db.insert(roles).values({
			id,
			name: input.name,
			description: input.description,
			isSystem: false,
			permissions: input.permissions ?? buildEmptyPermissionTree(),
			createdAt: now,
			updatedAt: now,
		});
		return id;
	},
	async update(
		id: string,
		patch: Partial<Pick<Role, "name" | "description" | "permissions">>,
	): Promise<void> {
		await db
			.update(roles)
			.set({ ...patch, updatedAt: nowIso() })
			.where(eq(roles.id, id));
	},
	async remove(id: string): Promise<void> {
		// Los roles de sistema no se pueden eliminar; ver docs/RBAC.md.
		await db
			.delete(roles)
			.where(and(eq(roles.id, id), eq(roles.isSystem, false)));
	},
	async togglePermission(
		roleId: string,
		module: AppModule,
		action: PermissionAction,
	): Promise<void> {
		const [role] = await db.select().from(roles).where(eq(roles.id, roleId));
		if (!role) return;

		const permissions = role.permissions.map((entry) => {
			if (entry.module !== module) return entry;
			const nextValue = !entry.actions[action];
			const actions = { ...entry.actions, [action]: nextValue };
			if (action === "ver" && !nextValue) {
				actions.crear = false;
				actions.editar = false;
				actions.eliminar = false;
			}
			if (action !== "ver" && nextValue) {
				actions.ver = true;
			}
			return { ...entry, actions };
		});

		await db
			.update(roles)
			.set({ permissions, updatedAt: nowIso() })
			.where(eq(roles.id, roleId));
	},
};
