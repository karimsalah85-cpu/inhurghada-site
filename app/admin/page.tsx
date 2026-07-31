import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { createClient } from "@/utils/supabase/server";
import { hasAdminPermission, isAuthorizedAdmin } from "@/lib/admin-auth";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) redirect("/admin/login");
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2") redirect("/admin/mfa");
  const canBookings = hasAdminPermission(user, "bookings") || hasAdminPermission(user, "reports");
  const canFinance = hasAdminPermission(user, "finance");
  const canSuppliers = hasAdminPermission(user, "suppliers");

  const [
    { data: bookings, error: bookingsError },
    { data: expenses, error: expensesError },
    { data: suppliers, error: suppliersError },
    { data: salesPeople, error: salesPeopleError },
  ] = await Promise.all([
    canBookings ? supabase.from("bookings").select("*").order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    canFinance ? supabase.from("expenses").select("*").order("expense_date", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    canSuppliers ? supabase.from("suppliers").select("*").order("name") : Promise.resolve({ data: [], error: null }),
    canFinance ? supabase.from("sales_people").select("*").order("name") : Promise.resolve({ data: [], error: null }),
  ]);
  const error = bookingsError?.message || expensesError?.message;

  const migrationPending = Boolean(suppliersError || salesPeopleError);

  return <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 sm:py-12"><div className="mx-auto max-w-7xl"><p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Operations</p><h1 className="mt-2 text-4xl font-black text-slate-900">Daily Red Sea Admin</h1><p className="mt-2 text-slate-600">Manage customer bookings, cash collection, partners, and business finances.</p>{error ? <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950"><p className="font-bold">The admin database access needs attention.</p><p className="mt-2 text-sm">{error}</p><p className="mt-2 text-sm">Run the authenticated-admin policy from <code>supabase/schema.sql</code> in Supabase SQL Editor, then refresh this page.</p></div> : <AdminDashboard initialBookings={bookings || []} initialExpenses={expenses || []} initialSuppliers={suppliers || []} initialSalesPeople={salesPeople || []} migrationPending={migrationPending} />}</div></main>;
}
