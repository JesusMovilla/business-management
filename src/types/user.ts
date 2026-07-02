export interface User {
	id: string;
	fullName: string;
	email: string;
	roleId: string;
	avatarUrl?: string;
	active: boolean;
}
