import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const [{ data: bookings, error: bookingsError }, { data: expenses, error: expensesError }] = await Promise.all([
    supabase.from("bookings").select("*").order("created_at", { ascending: false }),
    supabase.from("expenses").select("*").order("expense_date", { ascending: false }),
  ]);
  const totalSales = (bookings || []).filter((booking) => booking.payment_status === "paid").reduce((sum, booking) => sum + Number(booking.amount), 0);
  const totalExpenses = (expenses || []).reduce((sum, expense) => sum + Number(expense.amount), 0);

  return <main className="min-h-screen bg-slate-50 px-6 py-12"><div className="mx-auto max-w-7xl"><h1 className="text-4xl font-black text-slate-900">Daily Red Sea Admin</h1><p className="mt-2 text-slate-600">Manage bookings, cash payments, and business finances.</p><div className="mt-8 grid gap-5 md:grid-cols-3"><Metric label="Paid sales" value={`$${totalSales.toFixed(2)}`} /><Metric label="Expenses" value={`$${totalExpenses.toFixed(2)}`} /><Metric label="Profit" value={`$${(totalSales - totalExpenses).toFixed(2)}`} /></div>{bookingsError || expensesError ? <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950"><p className="font-bold">The admin database access needs attention.</p><p className="mt-2 text-sm">{bookingsError?.message || expensesError?.message}</p><p className="mt-2 text-sm">Run the authenticated-admin policy from <code>supabase/schema.sql</code> in Supabase SQL Editor, then refresh this page.</p></div> : null}<section className="mt-10 rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-2xl font-bold">Bookings</h2>{!bookingsError && !bookings?.length ? <p className="mt-4 text-sm text-slate-500">No bookings found yet.</p> : null}<div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-slate-500"><tr><th className="p-3">Reference</th><th className="p-3">Customer</th><th className="p-3">Trip</th><th className="p-3">Date</th><th className="p-3">Amount</th><th className="p-3">Status</th></tr></thead><tbody>{bookings?.map((booking) => <tr key={booking.id} className="border-b"><td className="p-3 font-medium">{booking.reference}</td><td className="p-3">{booking.customer_name}<br /><span className="text-slate-500">{booking.phone}</span></td><td className="p-3">{booking.tour_name || "Transfer"}</td><td className="p-3">{booking.date || "-"}</td><td className="p-3">{booking.amount} {booking.currency}</td><td className="p-3 capitalize">{booking.status} / {booking.payment_status}</td></tr>)}</tbody></table></div></section></div></main>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-3xl bg-slate-900 p-6 text-white"><p className="text-sm text-slate-300">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>; }
