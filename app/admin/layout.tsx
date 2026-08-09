import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import { adminRoles, hasAdminPermission, isAdminOwner, isAuthorizedAdmin, type AdminPermission, type AdminRole } from "@/lib/admin-auth";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) return children;
  const allPermissions = ["bookings", "content", "operations", "finance", "suppliers", "reports", "settings", "staff"] satisfies AdminPermission[];
  const permissions = allPermissions.filter((permission) => hasAdminPermission(user, permission));
  const role = isAdminOwner(user) ? "owner" : (adminRoles.includes(user?.app_metadata?.admin_role as AdminRole) ? user?.app_metadata?.admin_role as AdminRole : "operator");
  const deployment = (process.env.APP_ENV || process.env.VERCEL_ENV || process.env.NODE_ENV || "development").toLowerCase();
  const environment = deployment === "production" || deployment === "live" ? "live" : "test";
  return <AdminShell permissions={permissions} role={role} environment={environment}>{children}</AdminShell>;
}
