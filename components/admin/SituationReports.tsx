"use client";

import { useMemo, useState } from "react";
import { CalendarRange, Download, RotateCcw, TrendingUp, Users } from "lucide-react";

type BookingStatus = "new" | "confirmed" | "completed" | "cancelled";
type PaymentStatus = "unpaid" | "paid" | "refunded";
export type ReportBooking = {
  id: string; reference: string; tour_name: string | null; date: string | null; guests: number | null;
  amount: number | string; currency: string; status: BookingStatus; payment_status: PaymentStatus; created_at: string;
};

const pageSize = 10;
const cairoDate = (date = new Date()) => date.toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
const dateValue = (date: Date) => date.toLocaleDateString("en-CA");
const money = (amount: number, currency: string) => new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
const labelDate = (value: string) => new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
const queryValue = (value: string) => encodeURIComponent(value);

export default function SituationReports({ bookings }: { bookings: ReportBooking[] }) {
  const now = new Date();
  const monthStart = dateValue(new Date(now.getFullYear(), now.getMonth(), 1));
  const [mode, setMode] = useState<"today" | "next7" | "month" | "year" | "custom">("month");
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(cairoDate());
  const [trip, setTrip] = useState("all");
  const [status, setStatus] = useState("all");
  const [payment, setPayment] = useState("all");
  const [page, setPage] = useState(1);

  const trips = useMemo(() => [...new Set(bookings.map((item) => item.tour_name || "Private transfer"))].sort(), [bookings]);
  const invalidRange = !from || !to || from > to;
  const unscheduled = bookings.filter((item) => !item.date).length;
  const filtered = useMemo(() => invalidRange ? [] : bookings.filter((item) => item.date && item.date >= from && item.date <= to && (trip === "all" || (item.tour_name || "Private transfer") === trip) && (status === "all" || item.status === status) && (payment === "all" || item.payment_status === payment)), [bookings, from, invalidRange, payment, status, to, trip]);

  const statistics = useMemo(() => {
    const active = filtered.filter((item) => item.status !== "cancelled" && item.payment_status !== "refunded");
    const paid = active.filter((item) => item.payment_status === "paid");
    const unpaid = active.filter((item) => item.payment_status === "unpaid");
    const totals = (items: ReportBooking[]) => items.reduce<Record<string, number>>((all, item) => {
      const currency = item.currency || "USD"; all[currency] = (all[currency] || 0) + Number(item.amount || 0); return all;
    }, {});
    return {
      active, people: active.reduce((sum, item) => sum + Number(item.guests || 0), 0),
      cancelled: filtered.filter((item) => item.status === "cancelled").length,
      cancellationRate: filtered.length ? filtered.filter((item) => item.status === "cancelled").length / filtered.length * 100 : 0,
      expected: totals(active), collected: totals(paid), outstanding: totals(unpaid),
    };
  }, [filtered]);

  const serviceRows = useMemo(() => Object.entries(statistics.active.reduce<Record<string, { bookings: number; people: number; revenue: Record<string, number> }>>((all, item) => {
    const name = item.tour_name || "Private transfer"; const current = all[name] || { bookings: 0, people: 0, revenue: {} }; const currency = item.currency || "USD";
    current.bookings += 1; current.people += Number(item.guests || 0); current.revenue[currency] = (current.revenue[currency] || 0) + Number(item.amount || 0); all[name] = current; return all;
  }, {})).sort((a, b) => b[1].bookings - a[1].bookings), [statistics.active]);

  const dailyRows = useMemo(() => Object.entries(statistics.active.reduce<Record<string, { bookings: number; people: number }>>((all, item) => {
    const date = item.date!; const current = all[date] || { bookings: 0, people: 0 }; current.bookings += 1; current.people += Number(item.guests || 0); all[date] = current; return all;
  }, {})).sort(([a], [b]) => a.localeCompare(b)), [statistics.active]);
  const maxDailyPeople = Math.max(1, ...dailyRows.map(([, value]) => value.people));

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const query = `from=${queryValue(from)}&to=${queryValue(to)}&trip=${queryValue(trip)}&status=${queryValue(status)}&payment=${queryValue(payment)}`;

  function setPeriod(next: typeof mode) {
    setMode(next); const date = new Date(); const today = cairoDate(date);
    if (next === "today") { setFrom(today); setTo(today); }
    if (next === "next7") { const end = new Date(date); end.setDate(end.getDate() + 6); setFrom(today); setTo(dateValue(end)); }
    if (next === "month") { setFrom(dateValue(new Date(date.getFullYear(), date.getMonth(), 1))); setTo(today); }
    if (next === "year") { setFrom(dateValue(new Date(date.getFullYear(), 0, 1))); setTo(today); }
    setPage(1);
  }
  function reset() { setPeriod("month"); setTrip("all"); setStatus("all"); setPayment("all"); }

  return <section className="mt-10 rounded-3xl bg-white p-5 shadow-sm sm:p-7">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[.2em] text-cyan-700">Situation reports & statistics</p><h2 className="mt-2 text-2xl font-black">Know what is happening—and what is next</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Workload, guests, service performance and cash position based on the scheduled service date. Cancelled and refunded bookings are excluded from operating revenue.</p></div><div className="flex flex-wrap gap-2"><a aria-disabled={invalidRange} href={invalidRange ? undefined : `/api/admin/reports?format=pdf&${query}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold aria-disabled:pointer-events-none aria-disabled:opacity-40"><Download size={16}/> PDF</a><a aria-disabled={invalidRange} href={invalidRange ? undefined : `/api/admin/reports?format=xlsx&${query}`} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white aria-disabled:pointer-events-none aria-disabled:opacity-40"><Download size={16}/> Excel</a></div></div>

    <div className="mt-6 grid gap-3 lg:grid-cols-3 xl:grid-cols-6"><FilterLabel text="Period"><select value={mode} onChange={(event) => setPeriod(event.target.value as typeof mode)} className="report-input"><option value="today">Today</option><option value="next7">Next 7 days</option><option value="month">This month</option><option value="year">This year</option><option value="custom">Custom range</option></select></FilterLabel><FilterLabel text="From"><input type="date" value={from} onChange={(event) => { setMode("custom"); setFrom(event.target.value); setPage(1); }} className="report-input" /></FilterLabel><FilterLabel text="To"><input type="date" value={to} onChange={(event) => { setMode("custom"); setTo(event.target.value); setPage(1); }} className="report-input" /></FilterLabel><FilterLabel text="Service"><select value={trip} onChange={(event) => { setTrip(event.target.value); setPage(1); }} className="report-input"><option value="all">All services</option>{trips.map((item) => <option key={item}>{item}</option>)}</select></FilterLabel><FilterLabel text="Booking"><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="report-input"><option value="all">All statuses</option>{["new", "confirmed", "completed", "cancelled"].map((item) => <option key={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select></FilterLabel><FilterLabel text="Payment"><select value={payment} onChange={(event) => { setPayment(event.target.value); setPage(1); }} className="report-input"><option value="all">All payments</option>{["unpaid", "paid", "refunded"].map((item) => <option key={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select></FilterLabel></div>
    <div className="mt-3 flex min-h-6 items-center justify-between gap-4 text-xs">{invalidRange ? <p role="alert" className="font-bold text-rose-700">The start date must be before the end date.</p> : <p className="text-slate-500">{labelDate(from)}–{labelDate(to)} · {filtered.length} matching record{filtered.length === 1 ? "" : "s"}{unscheduled ? ` · ${unscheduled} awaiting a service date` : ""}</p>}<button type="button" onClick={reset} className="inline-flex shrink-0 items-center gap-1 font-bold text-slate-600 hover:text-slate-950"><RotateCcw size={13}/> Reset</button></div>

    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><StatCard icon={<CalendarRange size={18}/>} label="Active bookings" value={String(statistics.active.length)} note={`${statistics.cancelled} cancelled`} /><StatCard icon={<Users size={18}/>} label="Guests" value={String(statistics.people)} note="Active services" /><StatCard icon={<TrendingUp size={18}/>} label="Expected" value={formatTotals(statistics.expected)} note="Excludes cancelled/refunded" /><StatCard label="Collected" value={formatTotals(statistics.collected)} note="Marked paid" tone="emerald" /><StatCard label="Outstanding" value={formatTotals(statistics.outstanding)} note="Marked unpaid" tone="amber" /><StatCard label="Cancellation" value={`${statistics.cancellationRate.toFixed(1)}%`} note={`${statistics.cancelled} of ${filtered.length}`} tone={statistics.cancellationRate > 15 ? "rose" : "slate"} /></div>

    <div className="mt-7 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]"><div className="rounded-2xl border border-slate-200 p-5"><div className="flex items-center justify-between"><div><h3 className="font-black">Daily workload</h3><p className="mt-1 text-xs text-slate-500">Guests scheduled on active bookings</p></div><span className="text-xs font-bold text-slate-400">{dailyRows.length} service days</span></div><div className="mt-5 max-h-72 space-y-3 overflow-y-auto pr-1">{dailyRows.map(([date, values]) => <div key={date} className="grid grid-cols-[74px_1fr_auto] items-center gap-3 text-xs"><span className="font-semibold text-slate-600">{labelDate(date).replace(/, \d{4}/, "")}</span><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" style={{ width: `${Math.max(5, values.people / maxDailyPeople * 100)}%` }}/></div><span className="w-20 text-right font-bold">{values.people} guests</span></div>)}{!dailyRows.length ? <Empty text="No scheduled activity matches these filters."/> : null}</div></div>
      <div className="rounded-2xl border border-slate-200 p-5"><h3 className="font-black">Booking health</h3><p className="mt-1 text-xs text-slate-500">Status mix in the selected period</p><div className="mt-5 space-y-4">{(["new", "confirmed", "completed", "cancelled"] as BookingStatus[]).map((item) => { const count = filtered.filter((booking) => booking.status === item).length; return <div key={item}><div className="mb-1.5 flex justify-between text-xs"><span className="font-bold capitalize">{item}</span><span>{count} · {filtered.length ? Math.round(count / filtered.length * 100) : 0}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${statusBar[item]}`} style={{ width: `${filtered.length ? count / filtered.length * 100 : 0}%` }}/></div></div>; })}</div></div></div>

    <div className="mt-7"><div className="flex items-end justify-between"><div><h3 className="font-black">Top services</h3><p className="mt-1 text-xs text-slate-500">Ranked by active booking volume</p></div></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{serviceRows.slice(0, 6).map(([name, values], index) => <div key={name} className="rounded-2xl bg-slate-50 p-4"><div className="flex items-start gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-xs font-black text-blue-700 shadow-sm">{index + 1}</span><div className="min-w-0"><p className="truncate font-bold" title={name}>{name}</p><p className="mt-1 text-xs text-slate-500">{values.bookings} booking{values.bookings === 1 ? "" : "s"} · {values.people} guests</p><p className="mt-2 text-sm font-black text-slate-800">{formatTotals(values.revenue)}</p></div></div></div>)}{!serviceRows.length ? <Empty text="No service statistics for this period."/> : null}</div></div>

    <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-3">Reference</th><th className="p-3">Service</th><th className="p-3">Date</th><th className="p-3">Guests</th><th className="p-3">Booking</th><th className="p-3">Payment</th><th className="p-3 text-right">Amount</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="p-3 font-mono font-bold text-blue-700">{item.reference}</td><td className="max-w-64 truncate p-3" title={item.tour_name || "Private transfer"}>{item.tour_name || "Private transfer"}</td><td className="p-3 whitespace-nowrap">{item.date ? labelDate(item.date) : "To confirm"}</td><td className="p-3">{item.guests || 0}</td><td className="p-3"><Badge value={item.status}/></td><td className="p-3"><Badge value={item.payment_status}/></td><td className="p-3 text-right font-bold whitespace-nowrap">{money(Number(item.amount || 0), item.currency || "USD")}</td></tr>)}</tbody></table>{!rows.length ? <Empty text="No bookings match these report filters."/> : null}</div>
    <div className="mt-4 flex items-center justify-between text-sm"><span className="text-slate-500">Page {currentPage} of {totalPages}</span><div className="flex gap-2"><button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border px-3 py-2 font-bold disabled:opacity-40">Previous</button><button type="button" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border px-3 py-2 font-bold disabled:opacity-40">Next</button></div></div>
  </section>;
}

const statusBar: Record<BookingStatus, string> = { new: "bg-blue-500", confirmed: "bg-violet-500", completed: "bg-emerald-500", cancelled: "bg-rose-500" };
function formatTotals(totals: Record<string, number>) { const entries = Object.entries(totals); return entries.length ? entries.map(([currency, amount]) => money(amount, currency)).join(" + ") : "$0.00"; }
function FilterLabel({ text, children }: { text: string; children: React.ReactNode }) { return <label className="text-xs font-bold text-slate-600">{text}{children}</label>; }
function StatCard({ icon, label, value, note, tone = "blue" }: { icon?: React.ReactNode; label: string; value: string; note: string; tone?: "blue" | "emerald" | "amber" | "rose" | "slate" }) { const colors = { blue: "bg-blue-50 text-blue-700", emerald: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", rose: "bg-rose-50 text-rose-700", slate: "bg-slate-100 text-slate-700" }; return <div className={`rounded-2xl p-4 ${colors[tone]}`}><div className="flex items-center gap-2 text-xs font-bold">{icon}{label}</div><p className="mt-3 break-words text-xl font-black text-slate-950">{value}</p><p className="mt-1 text-[11px] text-slate-600">{note}</p></div>; }
function Badge({ value }: { value: BookingStatus | PaymentStatus }) { const colors: Record<string, string> = { new: "bg-blue-50 text-blue-700", confirmed: "bg-violet-50 text-violet-700", completed: "bg-emerald-50 text-emerald-700", cancelled: "bg-rose-50 text-rose-700", unpaid: "bg-amber-50 text-amber-700", paid: "bg-emerald-50 text-emerald-700", refunded: "bg-slate-100 text-slate-600" }; return <span className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${colors[value]}`}>{value}</span>; }
function Empty({ text }: { text: string }) { return <p className="col-span-full py-8 text-center text-sm text-slate-500">{text}</p>; }
