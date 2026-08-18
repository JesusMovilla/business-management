import { AdminRouteGuard } from "@/components/guards/admin-route-guard";

export default function AdminLimpiezaLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <AdminRouteGuard>{children}</AdminRouteGuard>;
}
