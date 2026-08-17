import "server-only";
import { redirect } from "next/navigation";
import { isAuthorizedAdmin, type AdminPermission } from "@/lib/admin-auth";
import { hasLivePermission } from "@/lib/admin-permission";
import { createClient } from "@/utils/supabase/server";

export async function requireAdminPage(permission?: AdminPermission) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) redirect("/admin/login");
  if (permission && !(await hasLivePermission(supabase, user, permission))) redirect("/admin");
  return { supabase, user: user! };
}
