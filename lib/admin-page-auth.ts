import "server-only";
import { redirect } from "next/navigation";
import { hasAdminPermission, isAuthorizedAdmin, type AdminPermission } from "@/lib/admin-auth";
import { createClient } from "@/utils/supabase/server";

export async function requireAdminPage(permission?: AdminPermission) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) redirect("/admin/login");
  if (permission && !hasAdminPermission(user, permission)) redirect("/admin");
  return { supabase, user: user! };
}
