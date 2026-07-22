"use client";

import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleDollarSign, ClipboardList, Download, ExternalLink, ListChecks, LogOut, Mail, Search, Trash2, UserRound, WalletCards } from "lucide-react";
import SituationReports from "@/components/admin/SituationReports";
import { countDistinctCustomers } from "@/lib/customer-count";

type Status = "new" | "confirmed" | "completed" | "cancelled";
type PaymentStatus = "unpaid" | "paid" | "refunded";
type Booking = {
  id: string; reference: string; customer_name: string; customer_email: string | null; phone: string;
  tour_name: string | null; date: string | null; guests: number | null; hotel: string | null; notes: string | null;
  amount: number | string; currency: string; status: Status; payment_status: PaymentStatus; created_at: string;
};
type Expense = { id: string; description: string; amount: number | string; currency: string; expense_date: string; category: string | null };

const money = (amount: number, currency = "USD") => new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
const statusColors: Record<Status | PaymentStatus, string> = {
  new: "bg-blue-50 text-blue-700", confirmed: "bg-violet-50 text-violet-700", completed: "bg-emerald-50 text-emerald-700", cancelled: "bg-rose-50 text-rose-700",
  unpaid: "bg-amber-50 text-amber-700", paid: "bg-emerald-50 text-emerald-700", refunded: "bg-slate-100 text-slate-600",
};

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The admin request failed.");
  return data as T;
}

export default function AdminDashboard({ initialBookings, initialExpenses }: { initialBookings: Booking[]; initialExpenses: Expense[] }) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [filter, setFilter] = useState<"all" | "active" | "unpaid" | "paid" | "cancelled">("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkPayment, setBulkPayment] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expense, setExpense] = useState({ description: "", amount: "", category: "", date: today() });

  const metrics = useMemo(() => {
    const active = bookings.filter((booking) => booking.status !== "cancelled" && booking.payment_status !== "refunded");
    const projected = active.reduce((sum, booking) => sum + Number(booking.amount), 0);
    const collected = bookings.filter((booking) => booking.payment_status === "paid").reduce((sum, booking) => sum + Number(booking.amount), 0);
    const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    return { projected, collected, outstanding: projected - collected, expenseTotal, profit: collected - expenseTotal, activeCount: active.length, customers: countDistinctCustomers(bookings) };
  }, [bookings, expenses]);

  const visibleBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesFilter = filter === "all" || (filter === "active" && booking.status !== "cancelled") || (filter === "unpaid" && booking.payment_status === "unpaid") || (filter === "paid" && booking.payment_status === "paid") || (filter === "cancelled" && booking.status === "cancelled");
      const matchesService = serviceFilter === "all" || (booking.tour_name || "Transfer") === serviceFilter;
      const matchesDate = (!fromDate || Boolean(booking.date && booking.date >= fromDate)) && (!toDate || Boolean(booking.date && booking.date <= toDate));
      const searchable = [booking.reference, booking.customer_name, booking.customer_email, booking.phone, booking.tour_name, booking.hotel, booking.date].filter(Boolean).join(" ").toLowerCase();
      return matchesFilter && matchesService && matchesDate && (!query || searchable.includes(query));
    });
  }, [bookings, filter, fromDate, search, serviceFilter, toDate]);
  const services = useMemo(() => [...new Set(bookings.map((booking) => booking.tour_name || "Transfer"))].sort(), [bookings]);
  const selectedIds = [...selected];
  const allVisibleSelected = Boolean(visibleBookings.length) && visibleBookings.every((booking) => selected.has(booking.id));

  function feedback(message: string) {
    setNotice(message); setError("");
    window.setTimeout(() => setNotice(""), 3500);
  }

  async function updateBooking(id: string, patch: Partial<Pick<Booking, "status" | "payment_status">>) {
    setBusyId(id); setError("");
    try {
      const result = await api<{ booking: Booking }>(`/api/admin/bookings/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      setBookings((items) => items.map((item) => item.id === id ? result.booking : item));
      feedback("Booking updated.");
      router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update the booking."); }
    finally { setBusyId(null); }
  }

  async function deleteBooking(id: string, reference: string) {
    if (!window.confirm(`Permanently delete booking ${reference}? Use Cancelled instead when you need to keep its history.`)) return;
    setBusyId(id); setError("");
    try {
      await api(`/api/admin/bookings/${id}`, { method: "DELETE" });
      setBookings((items) => items.filter((item) => item.id !== id));
      setSelected((items) => { const next = new Set(items); next.delete(id); return next; });
      feedback(`Booking ${reference} deleted.`);
      router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not delete the booking."); }
    finally { setBusyId(null); }
  }

  function toggleBooking(id: string) { setSelected((items) => { const next = new Set(items); if (next.has(id)) next.delete(id); else if (next.size < 100) next.add(id); return next; }); }
  function toggleVisible() { setSelected((items) => { const next = new Set(items); visibleBookings.forEach((booking) => { if (allVisibleSelected) next.delete(booking.id); else if (next.size < 100) next.add(booking.id); }); return next; }); }
  function clearFilters() { setSearch(""); setFilter("all"); setServiceFilter("all"); setFromDate(""); setToDate(""); }

  async function applyBulkAction() {
    if (!selectedIds.length || (!bulkStatus && !bulkPayment)) return;
    setBusyId("bulk"); setError("");
    try {
      const patch = { ...(bulkStatus ? { status: bulkStatus } : {}), ...(bulkPayment ? { payment_status: bulkPayment } : {}) };
      const result = await api<{ bookings: Booking[]; updated: number }>("/api/admin/bookings/bulk", { method: "PATCH", body: JSON.stringify({ ids: selectedIds, ...patch }) });
      const changed = new Map(result.bookings.map((booking) => [booking.id, booking]));
      setBookings((items) => items.map((booking) => changed.get(booking.id) || booking));
      setSelected(new Set()); setBulkStatus(""); setBulkPayment(""); feedback(`${result.updated} booking${result.updated === 1 ? "" : "s"} updated.`); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update the selected bookings."); }
    finally { setBusyId(null); }
  }

  function selectedReport(format: "pdf" | "xlsx") {
    return `/api/admin/reports?format=${format}&from=1900-01-01&to=2999-12-31&trip=all&status=all&payment=all&ids=${encodeURIComponent(selectedIds.join(","))}`;
  }
  function singleReport(id: string, format: "pdf" | "xlsx") {
    return `/api/admin/reports?format=${format}&from=1900-01-01&to=2999-12-31&trip=all&status=all&payment=all&ids=${id}`;
  }

  async function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusyId("expense"); setError("");
    try {
      const result = await api<{ expense: Expense }>("/api/admin/expenses", { method: "POST", body: JSON.stringify(expense) });
      setExpenses((items) => [result.expense, ...items]);
      setExpense({ description: "", amount: "", category: "", date: today() });
      feedback("Expense saved.");
      router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save the expense."); }
    finally { setBusyId(null); }
  }

  async function deleteExpense(item: Expense) {
    if (!window.confirm(`Delete expense “${item.description}”?`)) return;
    setBusyId(`expense-${item.id}`); setError("");
    try {
      await api(`/api/admin/expenses/${item.id}`, { method: "DELETE" });
      setExpenses((items) => items.filter((expenseItem) => expenseItem.id !== item.id));
      feedback("Expense deleted.");
      router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not delete the expense."); }
    finally { setBusyId(null); }
  }

  async function signOut() {
    setBusyId("logout");
    try { await api("/api/admin/logout", { method: "POST" }); }
    catch { /* A local redirect still clears access to the dashboard UI. */ }
    finally { window.location.assign("/admin/login"); }
  }

  return <>
    <div className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <nav aria-label="Admin sections" className="flex flex-wrap gap-1 text-sm font-bold"><a href="#bookings" className="rounded-lg px-3 py-2 hover:bg-slate-100">Bookings</a><a href="#expenses" className="rounded-lg px-3 py-2 hover:bg-slate-100">Expenses</a><a href="#reports" className="rounded-lg px-3 py-2 hover:bg-slate-100">Reports</a></nav>
      <button type="button" onClick={signOut} disabled={busyId === "logout"} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-500 disabled:opacity-50"><LogOut size={16}/>{busyId === "logout" ? "Signing out…" : "Sign out"}</button>
    </div>

    <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <Metric icon={<UserRound size={19}/>} label="Customers" value={String(metrics.customers)} note="Unique phone numbers" tone="slate" />
      <Metric icon={<ClipboardList size={19}/>} label="Booked revenue" value={money(metrics.projected)} note={`${metrics.activeCount} active booking${metrics.activeCount === 1 ? "" : "s"}`} tone="blue" />
      <Metric icon={<WalletCards size={19}/>} label="Cash collected" value={money(metrics.collected)} note="Marked as paid" tone="emerald" />
      <Metric icon={<CircleDollarSign size={19}/>} label="Outstanding" value={money(metrics.outstanding)} note="Still to collect" tone="amber" />
      <Metric icon={<WalletCards size={19}/>} label="Expenses" value={money(metrics.expenseTotal)} note="Business costs" tone="rose" />
      <Metric icon={<CheckCircle2 size={19}/>} label="Cash profit" value={money(metrics.profit)} note="Collected less expenses" tone="slate" />
    </div>

    {error ? <div role="alert" className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">{error}</div> : null}
    {notice ? <div role="status" className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">{notice}</div> : null}

    <div className="mt-10 grid gap-8 xl:grid-cols-[1.7fr_0.8fr]">
      <section id="bookings" className="scroll-mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-bold">Bookings</h2><p className="mt-1 text-sm text-slate-500">Search, confirm availability, record cash, or cancel a request.</p></div><p className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{visibleBookings.length} shown</p></div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5"><label className="relative xl:col-span-2"><span className="sr-only">Search bookings</span><Search className="absolute left-3 top-3 text-slate-400" size={18}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reference, guest, phone, trip, hotel…" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 outline-none focus:border-cyan-500" /></label><select aria-label="Booking filter" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium"><option value="all">All bookings</option><option value="active">Active</option><option value="unpaid">Awaiting cash</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option></select><select aria-label="Service filter" value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium"><option value="all">All services</option>{services.map((service) => <option key={service}>{service}</option>)}</select><button type="button" onClick={clearFilters} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold">Clear filters</button><label className="text-xs font-bold text-slate-500">From<input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-900" /></label><label className="text-xs font-bold text-slate-500">To<input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-900" /></label></div>

        <div className={`mt-5 rounded-2xl border p-4 ${selectedIds.length ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"}`}><div className="flex flex-wrap items-center gap-3"><span className="inline-flex items-center gap-2 text-sm font-black"><ListChecks size={17}/>{selectedIds.length} selected</span><select aria-label="Group booking status" value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)} disabled={!selectedIds.length} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm capitalize disabled:opacity-50"><option value="">Keep booking status</option>{["new", "confirmed", "completed", "cancelled"].map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Group payment status" value={bulkPayment} onChange={(event) => setBulkPayment(event.target.value)} disabled={!selectedIds.length} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm capitalize disabled:opacity-50"><option value="">Keep payment status</option>{["unpaid", "paid", "refunded"].map((item) => <option key={item}>{item}</option>)}</select><button type="button" onClick={applyBulkAction} disabled={!selectedIds.length || (!bulkStatus && !bulkPayment) || busyId === "bulk"} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{busyId === "bulk" ? "Updating…" : "Apply to selected"}</button><a aria-disabled={!selectedIds.length} href={selectedIds.length ? selectedReport("pdf") : undefined} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold aria-disabled:pointer-events-none aria-disabled:opacity-40"><Download size={15}/> PDF</a><a aria-disabled={!selectedIds.length} href={selectedIds.length ? selectedReport("xlsx") : undefined} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold aria-disabled:pointer-events-none aria-disabled:opacity-40"><Download size={15}/> Excel</a>{selectedIds.length ? <button type="button" onClick={() => setSelected(new Set())} className="text-sm font-bold text-slate-600">Clear selection</button> : null}</div><p className="mt-2 text-xs text-slate-500">Select up to 100 bookings, then update them together or download only those records.</p></div>

        <div className="mt-5 hidden overflow-x-auto lg:block"><table className="w-full min-w-[950px] text-left text-sm"><thead className="border-b text-slate-500"><tr><th className="p-3"><input type="checkbox" aria-label="Select all filtered bookings" checked={allVisibleSelected} onChange={toggleVisible}/></th><th className="p-3">Reference & customer</th><th className="p-3">Trip & pickup</th><th className="p-3">Amount</th><th className="p-3">Booking</th><th className="p-3">Payment</th><th className="p-3">Actions</th></tr></thead><tbody>{visibleBookings.map((booking) => <tr key={booking.id} className={`border-b align-top ${selected.has(booking.id) ? "bg-blue-50/60" : ""}`}><td className="p-3"><input type="checkbox" aria-label={`Select ${booking.reference}`} checked={selected.has(booking.id)} onChange={() => toggleBooking(booking.id)}/></td><td className="p-3"><button type="button" onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)} className="font-mono font-bold text-blue-700 hover:underline">{booking.reference}</button><p className="mt-1 font-semibold">{booking.customer_name}</p><ContactLinks booking={booking}/>{expandedId === booking.id && booking.notes ? <p className="mt-2 max-w-xs whitespace-pre-line rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{booking.notes}</p> : null}</td><td className="p-3"><p className="font-medium">{booking.tour_name || "Transfer"}</p><p className="mt-1 text-slate-500">{booking.date || "Date to confirm"} · {booking.guests || 0} people</p>{booking.hotel ? <p className="mt-1 max-w-xs text-xs text-slate-500">Pickup: {booking.hotel}</p> : null}</td><td className="p-3 font-semibold">{money(Number(booking.amount), booking.currency)}</td><td className="p-3"><StatusSelect value={booking.status} disabled={busyId === booking.id} onChange={(value) => updateBooking(booking.id, { status: value as Status })} options={["new", "confirmed", "completed", "cancelled"]}/></td><td className="p-3"><StatusSelect value={booking.payment_status} disabled={busyId === booking.id} onChange={(value) => updateBooking(booking.id, { payment_status: value as PaymentStatus })} options={["unpaid", "paid", "refunded"]}/></td><td className="p-3"><div className="flex items-center gap-1"><a href={singleReport(booking.id, "pdf")} aria-label={`Download report ${booking.reference}`} title="Download PDF report" className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"><Download size={17}/></a><button aria-label={`Delete ${booking.reference}`} title="Delete permanently" disabled={busyId === booking.id} onClick={() => deleteBooking(booking.id, booking.reference)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"><Trash2 size={17}/></button></div></td></tr>)}</tbody></table></div>

        <div className="mt-5 space-y-4 lg:hidden"><label className="flex items-center gap-2 text-sm font-bold text-slate-600"><input type="checkbox" checked={allVisibleSelected} onChange={toggleVisible}/> Select all filtered bookings</label>{visibleBookings.map((booking) => <article key={booking.id} className={`rounded-2xl border p-4 ${selected.has(booking.id) ? "border-blue-300 bg-blue-50" : "border-slate-200"}`}><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><input type="checkbox" aria-label={`Select ${booking.reference}`} checked={selected.has(booking.id)} onChange={() => toggleBooking(booking.id)} className="mt-1"/><div><p className="font-mono text-sm font-bold text-blue-700">{booking.reference}</p><h3 className="mt-1 font-bold">{booking.customer_name}</h3></div></div><p className="font-black">{money(Number(booking.amount), booking.currency)}</p></div><p className="mt-3 font-medium">{booking.tour_name || "Transfer"}</p><p className="mt-1 text-sm text-slate-500">{booking.date || "Date to confirm"} · {booking.guests || 0} people</p>{booking.hotel ? <p className="mt-1 text-xs text-slate-500">Pickup: {booking.hotel}</p> : null}<ContactLinks booking={booking}/>{booking.notes ? <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold text-slate-600">Customer notes</summary><p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{booking.notes}</p></details> : null}<div className="mt-4 grid grid-cols-2 gap-3"><StatusSelect value={booking.status} disabled={busyId === booking.id} onChange={(value) => updateBooking(booking.id, { status: value as Status })} options={["new", "confirmed", "completed", "cancelled"]}/><StatusSelect value={booking.payment_status} disabled={busyId === booking.id} onChange={(value) => updateBooking(booking.id, { payment_status: value as PaymentStatus })} options={["unpaid", "paid", "refunded"]}/></div><div className="mt-4 flex items-center gap-4"><a href={singleReport(booking.id, "pdf")} className="inline-flex items-center gap-2 text-xs font-bold text-blue-700"><Download size={14}/> Download report</a><button type="button" onClick={() => deleteBooking(booking.id, booking.reference)} disabled={busyId === booking.id} className="inline-flex items-center gap-2 text-xs font-bold text-rose-700 disabled:opacity-40"><Trash2 size={14}/> Delete permanently</button></div></article>)}</div>
        {!visibleBookings.length ? <div className="py-12 text-center"><Search className="mx-auto text-slate-300"/><p className="mt-3 text-sm font-semibold text-slate-600">No bookings match this search and filter.</p></div> : null}
      </section>

      <aside id="expenses" className="h-fit scroll-mt-6 rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-2xl font-bold">Expenses</h2><p className="mt-1 text-sm leading-6 text-slate-500">Record fuel, boat costs, guide fees, advertising, or other costs.</p><form className="mt-6 space-y-4" onSubmit={addExpense}><label className="block text-sm font-semibold">Description<input required maxLength={200} value={expense.description} onChange={(event) => setExpense({ ...expense, description: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal" placeholder="e.g. Boat fuel" /></label><label className="block text-sm font-semibold">Amount (USD)<input required type="number" min="0.01" max="1000000" step="0.01" value={expense.amount} onChange={(event) => setExpense({ ...expense, amount: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal" placeholder="0.00" /></label><label className="block text-sm font-semibold">Category <span className="font-normal text-slate-400">optional</span><input maxLength={80} value={expense.category} onChange={(event) => setExpense({ ...expense, category: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal" placeholder="Fuel, guide, marketing…" /></label><label className="block text-sm font-semibold">Date<input required type="date" value={expense.date} onChange={(event) => setExpense({ ...expense, date: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal" /></label><button disabled={busyId === "expense"} className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-700 disabled:opacity-60">{busyId === "expense" ? "Saving…" : "Save expense"}</button></form>{expenses.length ? <div className="mt-7 border-t pt-5"><div className="flex items-center justify-between"><p className="text-sm font-bold">Recent expenses</p><p className="text-xs text-slate-500">{expenses.length} total</p></div><div className="mt-3 space-y-3">{expenses.slice(0, 8).map((item) => <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm"><div><p className="font-medium">{item.description}</p><p className="text-xs text-slate-500">{item.category || "Other"} · {item.expense_date}</p></div><div className="flex items-center gap-2"><p className="font-semibold">{money(Number(item.amount), item.currency)}</p><button type="button" aria-label={`Delete expense ${item.description}`} onClick={() => deleteExpense(item)} disabled={busyId === `expense-${item.id}`} className="rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-700 disabled:opacity-40"><Trash2 size={15}/></button></div></div>)}</div></div> : <p className="mt-7 border-t pt-5 text-sm text-slate-500">No expenses recorded yet.</p>}</aside>
    </div>
    <div id="reports" className="scroll-mt-6"><SituationReports bookings={bookings} /></div>
  </>;
}

function ContactLinks({ booking }: { booking: Booking }) {
  const phone = booking.phone.replace(/\D/g, "");
  return <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold"><a className="inline-flex items-center gap-1 text-emerald-700 hover:underline" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">WhatsApp <ExternalLink size={12}/></a>{booking.customer_email ? <a className="inline-flex items-center gap-1 text-blue-700 hover:underline" href={`mailto:${booking.customer_email}`}><Mail size={12}/>{booking.customer_email}</a> : null}</div>;
}

function StatusSelect({ value, disabled, onChange, options }: { value: Status | PaymentStatus; disabled: boolean; onChange: (value: string) => void; options: string[] }) {
  return <select aria-label={`Change ${value} status`} disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className={`w-full rounded-lg border-0 px-2 py-1.5 text-xs font-bold capitalize outline-none ring-1 ring-inset ring-black/5 ${statusColors[value]}`}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
}

function Metric({ icon, label, value, note, tone }: { icon: ReactNode; label: string; value: string; note: string; tone: "blue" | "emerald" | "amber" | "rose" | "slate" }) {
  const colors = { blue: "border-blue-100 bg-blue-50 text-blue-700", emerald: "border-emerald-100 bg-emerald-50 text-emerald-700", amber: "border-amber-100 bg-amber-50 text-amber-700", rose: "border-rose-100 bg-rose-50 text-rose-700", slate: "border-slate-200 bg-slate-100 text-slate-700" };
  return <div className={`rounded-3xl border p-5 ${colors[tone]}`}><div className="flex items-center gap-2 text-sm font-semibold">{icon}{label}</div><p className="mt-4 text-3xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-600">{note}</p></div>;
}
