import { redirect } from "next/navigation";
import TeamManagement from "@/components/admin/TeamManagement";
import PermissionsMatrix from "@/components/admin/PermissionsMatrix";
import { hasAdminPermission, isAdminOwner } from "@/lib/admin-auth";
import { createClient } from "@/utils/supabase/server";

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const canManage = isAdminOwner(user);
  if (!canManage && !hasAdminPermission(user, "settings")) redirect("/admin");
  return <main className="min-h-screen bg-slate-50 p-6"><div className="mx-auto max-w-7xl"><TeamManagement canManage={canManage}/>{canManage ? <PermissionsMatrix/> : <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-950">You can view current users. Inviting users, changing roles, deactivating accounts, and editing permissions require the owner account.</p>}</div></main>;
}
