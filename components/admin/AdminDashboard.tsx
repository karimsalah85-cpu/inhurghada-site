"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleDollarSign, ClipboardList, Trash2, WalletCards } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import SituationReports from "@/components/admin/SituationReports";

type Booking = {
  id: string; reference: string; customer_name: string; customer_email: string | null; phone: string;
  tour_name: string | null; date: string | null; guests: number | null; hotel: string | null;
  amount: number | string; currency: string; status: "new" | "confirmed" | "completed" | "cancelled";
  payment_status: "unpaid" | "paid" | "refunded"; created_at: string;
};
type Expense = { id: string; description: string; amount: number | string; currency: string; expense_date: string; category: string | null };
type Status = Booking["status"];
type PaymentStatus = Booking["payment_status"];

const money = (amount: number, currency = "USD") => new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
const today = () => new Date().toISOString().slice(0, 10);

export default function AdminDashboard({ initialBookings, initialExpenses }: { initialBookings: Booking[]; initialExpenses: Expense[] }) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [filter, setFilter] = useState<"all" | "active" | "unpaid" | "paid" | "cancelled">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [expense, setExpense] = useState({ description: "", amount: "", category: "", date: today() });

  const metrics = useMemo(() => {
    const active = bookings.filter((booking) => booking.status !== "cancelled" && booking.payment_status !== "refunded");
    const projected = active.reduce((sum, booking) => sum + Number(booking.amount), 0);
    const collected = bookings.filter((booking) => booking.payment_status === "paid").reduce((sum, booking) => sum + Number(booking.amount), 0);
    const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    return { projected, collected, outstanding: projected - collected, expenseTotal, profit: collected - expenseTotal, activeCount: active.length };
  }, [bookings, expenses]);

  const visibleBookings = bookings.filter((booking) => filter === "all" || (filter === "active" && booking.status !== "cancelled") || (filter === "unpaid" && booking.payment_status === "unpaid") || (filter === "paid" && booking.payment_status === "paid") || (filter === "cancelled" && booking.status === "cancelled"));

  async function updateBooking(id: string, patch: Partial<Pick<Booking, "status" | "payment_status">>) {
    setBusyId(id); setError("");
    const { error: updateError } = await createClient().from("bookings").update(patch).eq("id", id);
    if (updateError) { setError(updateError.message); setBusyId(null); return; }
    setBookings((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
    setBusyId(null); router.refresh();
  }

  async function deleteBooking(id: string, reference: string) {
    if (!window.confirm(`Delete booking ${reference}? This cannot be undone.`)) return;
    setBusyId(id); setError("");
    const { error: deleteError } = await createClient().from("bookings").delete().eq("id", id);
    if (deleteError) { setError(deleteError.message); setBusyId(null); return; }
    setBookings((items) => items.filter((item) => item.id !== id)); setBusyId(null); router.refresh();
  }

  async function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const amount = Number(expense.amount);
    if (!expense.description.trim() || !Number.isFinite(amount) || amount <= 0) { setError("Enter an expense description and a positive amount."); return; }
    setBusyId("expense");
    const { data, error: insertError } = await createClient().from("expenses").insert({ description: expense.description.trim(), amount, currency: "USD", expense_date: expense.date, category: expense.category.trim() || null }).select().single();
    if (insertError) { setError(insertError.message); setBusyId(null); return; }
    setExpenses((items) => [data as Expense, ...items]); setExpense({ description: "", amount: "", category: "", date: today() }); setBusyId(null); router.refresh();
  }

  return <>
    <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
      <Metric icon={<ClipboardList size={19}/>} label="Booked revenue" value={money(metrics.projected)} note={`${metrics.activeCount} active booking${metrics.activeCount === 1 ? "" : "s"}`} tone="blue" />
      <Metric icon={<WalletCards size={19}/>} label="Cash collected" value={money(metrics.collected)} note="Marked as paid" tone="emerald" />
      <Metric icon={<CircleDollarSign size={19}/>} label="Outstanding" value={money(metrics.outstanding)} note="Still to collect" tone="amber" />
      <Metric icon={<WalletCards size={19}/>} label="Expenses" value={money(metrics.expenseTotal)} note="Business costs" tone="rose" />
      <Metric icon={<CheckCircle2 size={19}/>} label="Cash profit" value={money(metrics.profit)} note="Collected less expenses" tone="slate" />
    </div>

    {error ? <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div> : null}

    <div className="mt-10 grid gap-8 xl:grid-cols-[1.7fr_0.8fr]">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-bold">Bookings</h2><p className="mt-1 text-sm text-slate-500">Confirm availability, record cash received, or cancel a request.</p></div><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium"><option value="all">All bookings</option><option value="active">Active</option><option value="unpaid">Awaiting cash</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option></select></div>
        <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead className="border-b text-slate-500"><tr><th className="p-3">Reference & customer</th><th className="p-3">Trip & date</th><th className="p-3">Amount</th><th className="p-3">Booking status</th><th className="p-3">Payment</th><th className="p-3">Action</th></tr></thead><tbody>{visibleBookings.map((booking) => <tr key={booking.id} className="border-b align-top"><td className="p-3 font-medium text-slate-900"><p>{booking.reference}</p><p className="mt-1 font-normal">{booking.customer_name}</p><a className="font-normal text-blue-700" href={`https://wa.me/${booking.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">{booking.phone}</a></td><td className="p-3"><p className="font-medium">{booking.tour_name || "Transfer"}</p><p className="mt-1 text-slate-500">{booking.date || "Date to confirm"}</p>{booking.hotel ? <p className="mt-1 text-xs text-slate-500">Pickup: {booking.hotel}</p> : null}</td><td className="p-3 font-semibold">{money(Number(booking.amount), booking.currency)}</td><td className="p-3"><select disabled={busyId === booking.id} value={booking.status} onChange={(event) => updateBooking(booking.id, { status: event.target.value as Status })} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 capitalize"><option value="new">New</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></td><td className="p-3"><select disabled={busyId === booking.id} value={booking.payment_status} onChange={(event) => updateBooking(booking.id, { payment_status: event.target.value as PaymentStatus })} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 capitalize"><option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="refunded">Refunded</option></select></td><td className="p-3"><button aria-label={`Delete ${booking.reference}`} disabled={busyId === booking.id} onClick={() => deleteBooking(booking.id, booking.reference)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"><Trash2 size={17}/></button></td></tr>)}</tbody></table></div>{!visibleBookings.length ? <p className="py-10 text-center text-sm text-slate-500">No matching bookings.</p> : null}</section>

      <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-2xl font-bold">Add expense</h2><p className="mt-1 text-sm leading-6 text-slate-500">Record fuel, boat costs, guide fees, advertising, or any business cost.</p><form className="mt-6 space-y-4" onSubmit={addExpense}><label className="block text-sm font-semibold">Description<input required value={expense.description} onChange={(event) => setExpense({ ...expense, description: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal" placeholder="e.g. Boat fuel" /></label><label className="block text-sm font-semibold">Amount (USD)<input required inputMode="decimal" min="0.01" step="0.01" value={expense.amount} onChange={(event) => setExpense({ ...expense, amount: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal" placeholder="0.00" /></label><label className="block text-sm font-semibold">Category <span className="font-normal text-slate-400">optional</span><input value={expense.category} onChange={(event) => setExpense({ ...expense, category: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal" placeholder="Fuel, guide, marketing..." /></label><label className="block text-sm font-semibold">Date<input required type="date" value={expense.date} onChange={(event) => setExpense({ ...expense, date: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal" /></label><button disabled={busyId === "expense"} className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-700 disabled:opacity-60">{busyId === "expense" ? "Saving…" : "Save expense"}</button></form>{expenses.length ? <div className="mt-7 border-t pt-5"><p className="text-sm font-bold text-slate-900">Recent expenses</p><div className="mt-3 space-y-3">{expenses.slice(0, 5).map((item) => <div key={item.id} className="flex justify-between gap-3 text-sm"><div><p className="font-medium">{item.description}</p><p className="text-xs text-slate-500">{item.category || "Other"} · {item.expense_date}</p></div><p className="font-semibold">{money(Number(item.amount), item.currency)}</p></div>)}</div></div> : null}</aside>
    </div>
    <SituationReports bookings={bookings} />
  </>;
}

function Metric({ icon, label, value, note, tone }: { icon: React.ReactNode; label: string; value: string; note: string; tone: "blue" | "emerald" | "amber" | "rose" | "slate" }) {
  const colors = { blue: "border-blue-100 bg-blue-50 text-blue-700", emerald: "border-emerald-100 bg-emerald-50 text-emerald-700", amber: "border-amber-100 bg-amber-50 text-amber-700", rose: "border-rose-100 bg-rose-50 text-rose-700", slate: "border-slate-200 bg-slate-100 text-slate-700" };
  return <div className={`rounded-3xl border p-5 ${colors[tone]}`}><div className="flex items-center gap-2 text-sm font-semibold">{icon}{label}</div><p className="mt-4 text-3xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-600">{note}</p></div>;
}
