import type { PermissionTree } from "./permission";

export interface Role {
	id: string;
	name: string;
	description?: string;
	isSystem: boolean;
	permissions: PermissionTree;
	createdAt: string;
	updatedAt: string;
}
