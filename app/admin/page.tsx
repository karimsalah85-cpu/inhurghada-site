import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { createClient } from "@/utils/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const [{ data: bookings, error: bookingsError }, { data: expenses, error: expensesError }] = await Promise.all([
    supabase.from("bookings").select("*").order("created_at", { ascending: false }),
    supabase.from("expenses").select("*").order("expense_date", { ascending: false }),
  ]);
  const error = bookingsError?.message || expensesError?.message;

  return <main className="min-h-screen bg-slate-50 px-6 py-12"><div className="mx-auto max-w-7xl"><p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Operations</p><h1 className="mt-2 text-4xl font-black text-slate-900">Daily Red Sea Admin</h1><p className="mt-2 text-slate-600">Manage customer bookings, cash collection, and business finances.</p>{error ? <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950"><p className="font-bold">The admin database access needs attention.</p><p className="mt-2 text-sm">{error}</p><p className="mt-2 text-sm">Run the authenticated-admin policy from <code>supabase/schema.sql</code> in Supabase SQL Editor, then refresh this page.</p></div> : <AdminDashboard initialBookings={bookings || []} initialExpenses={expenses || []} />}</div></main>;
}
