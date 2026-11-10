"use client";

import WeeklyWorkloadChart from "@/components/admin/WeeklyWorkloadChart";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Clock3, RefreshCw, Truck, UsersRound, WalletCards } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminPermission, AdminRole } from "@/lib/admin-auth";
import { summarizeAdminWork, overviewGuestCount, type OverviewBooking, type OverviewSetup } from "@/lib/admin-overview";
import { visibleNav } from "@/components/admin/admin-nav";
import { moneyBreakdown } from "@/lib/admin-money";
import type { AdminAttention } from "@/lib/admin-attention";

type FinancialSummary = {
  projectedByCurrency: Record<string, number>;
  collectedByCurrency: Record<string, number>;
  expenseByCurrency: Record<string, number>;
  profitByCurrency: Record<string, number>;
};

type Props = {
  bookings: OverviewBooking[];
  permissions: AdminPermission[];
  role: AdminRole;
  day: string;
  metrics: FinancialSummary;
  rowsMayBeTruncated: boolean;
  onOpenBooking: (id: string) => void;
  tripChanges: { id: string; title: string; listing_status: string; updated_at: string }[];
  attention?: AdminAttention | null;
  setup?: OverviewSetup | null;
};

export default function AdminOverview({ bookings, permissions, role, day, metrics, rowsMayBeTruncated, onOpenBooking, tripChanges, attention = null, setup = null }: Props) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const can = (permission: AdminPermission) => permissions.includes(permission);
  const canReadBookings = can("bookings") || can("reports");
  const work = summarizeAdminWork(bookings, day);
  const dateLabel = new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
  const workspaces = visibleNav(permissions, role).filter((group) => group.label !== "Today");
  return <div className="mt-7 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-medium text-slate-600">{dateLabel} <span className="text-slate-400">· Cairo time</span></p>
      <button type="button" disabled={refreshing} onClick={() => startRefresh(() => router.refresh())} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />{refreshing ? "Refreshing…" : "Refresh overview"}</button>
    </div>
    {rowsMayBeTruncated ? <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><strong>Partial data: some records may be missing.</strong><p className="mt-1">A record limit was reached. Counts, queues and totals below cover loaded records only and may understate activity.</p></div> : null}
    {attention ? <AttentionList attention={attention} /> : null}
    {setup && can("operations") ? <section aria-labelledby="setup-heading" className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 id="setup-heading" className="text-lg font-black">Dispatch setup</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Link href="/admin/availability" className="min-w-0 rounded-xl border border-slate-200 p-4 hover:border-cyan-500"><h3 className="font-bold">Future dates with seat limits: {setup.capacityDates ?? "Unavailable"}</h3><p className="mt-1 text-sm text-slate-600">{setup.capacityDates === 0 ? "All dates are open by default. Add a seat limit or close a date only when needed." : setup.capacityDates == null ? "Capacity settings could not be checked. Open availability to review them." : "These dates have admin-set limits. Other dates stay open unless an admin closes them."}</p><span className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-cyan-800">Manage limits & closures <ArrowRight size={15} /></span></Link>
        <Link href="/admin/operations/pickup-zones" className="min-w-0 rounded-xl border border-slate-200 p-4 hover:border-cyan-500"><h3 className="font-bold">Pickup zones: {setup.pickupZones ?? "Unavailable"}</h3><p className="mt-1 text-sm text-slate-600">{setup.pickupZones === 0 ? "No zones are configured. Add hotels and standard pickup times to support dispatch." : setup.pickupZones == null ? "Pickup zones could not be checked. Open hotels and pickup times to review them." : "Review hotel mappings and the standard pickup time for each trip."}</p><span className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-cyan-800">Hotels & pickup times <ArrowRight size={15} /></span></Link>
      </div>
    </section> : null}
    {canReadBookings ? <>
      <section aria-labelledby="today-heading">
        <h2 id="today-heading" className="text-xl font-black text-slate-950">Today at a glance</h2>
        <p className="mt-1 text-sm text-slate-500">Daily workload and requests that need your attention.</p>
        {can("operations") ? <Link href={`/admin/operations/manifest?date=${day}`} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-cyan-800">Open today’s pickup manifest <ArrowRight size={15} /></Link> : null}
        <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-3">
          <WorkMetric label="Departures today" value={work.today.length} note="Scheduled trip legs · new or confirmed" icon={<CalendarDays size={19} />} />
          <WorkMetric label="Guests today" value={work.missingGuestCounts ? (work.todayGuests ? `${work.todayGuests}+` : "—") : work.todayGuests} note={work.missingGuestCounts ? `${work.missingGuestCounts} booking(s) missing guest counts` : "Guest places on today’s trip legs"} icon={<UsersRound size={19} />} />
          <WorkMetric label="Departures in next 7 days" value={work.nextWeek.length} note="Today through the following 6 days" icon={<CalendarDays size={19} />} />
          <WorkMetric label="Guests in next 7 days" value={work.nextWeekMissingGuestCounts ? (work.nextWeekGuests ? `${work.nextWeekGuests}+` : "—") : work.nextWeekGuests} note={work.nextWeekMissingGuestCounts ? `${work.nextWeekMissingGuestCounts} booking(s) missing guest counts` : "Guest places · travelers on each trip leg"} icon={<UsersRound size={19} />} />
          <WorkMetric label="To confirm" value={work.pending.length} note="All dates · new requests" icon={<Clock3 size={19} />} attention={work.pending.length > 0} />
          <WorkMetric label="Past-date not marked paid" value={work.overdue.length} note="Trip date before today" icon={<WalletCards size={19} />} attention={work.overdue.length > 0} />
        </div>
      </section>
      <WeeklyWorkloadChart days={work.dailyForecast} canDispatch={can("operations")} />
      {work.undatedDepartures ? <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{work.undatedDepartures} trip leg(s) have no recorded date and are excluded from daily and seven-day totals. Review the booking dates before planning dispatch.</p> : null}
      <div className="grid items-start gap-6 xl:grid-cols-[1.25fr_1fr]">
        <section aria-labelledby="upcoming-heading" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5"><div><h2 id="upcoming-heading" className="text-lg font-black">Next departures</h2><p className="mt-1 text-sm text-slate-500">Today onward · next {Math.min(6, work.upcoming.length)} of {work.upcoming.length}</p></div><Link href="/admin/bookings" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-cyan-800">All bookings <ArrowRight size={15} /></Link></div>
          <BookingQueue bookings={work.upcoming.slice(0, 6)} day={day} onOpen={onOpenBooking} empty="No upcoming departures. New bookings will appear here." />
        </section>
        <section aria-labelledby="pending-heading" className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
          <div className="border-b border-amber-100 bg-amber-50/60 p-5"><div className="flex items-center justify-between gap-3"><h2 id="pending-heading" className="text-lg font-black">Confirm requests</h2><span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">{work.pending.length}</span></div><p className="mt-1 text-sm text-slate-600">Earliest trip dates first. Open a request to review it.</p></div>
          <BookingQueue bookings={work.pending.slice(0, 5)} day={day} onOpen={onOpenBooking} empty="You’re caught up. No requests waiting for confirmation." />
          {work.pending.length > 5 ? <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Showing the first 5 of {work.pending.length} requests across all dates.</p> : null}
        </section>
      </div>
      <section aria-labelledby="overdue-heading" className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
        <div className="border-b border-amber-100 p-5"><h2 id="overdue-heading" className="text-lg font-black">Past-date bookings not marked paid · {work.overdue.length}</h2><p className="mt-1 text-sm text-slate-500">Oldest trip dates first. This follows booking payment status, not the accounting ledger. Open a booking to review it. Showing {Math.min(5, work.overdue.length)} of {work.overdue.length}.</p></div>
        {can("finance") ? <Link href="/admin/finance/payments-to-record" className="inline-flex min-h-11 items-center gap-2 px-5 text-sm font-bold text-cyan-800">Review accounting payments to record <ArrowRight size={15} /></Link> : null}
        <BookingQueue bookings={work.overdue.slice(0, 5)} day={day} onOpen={onOpenBooking} empty="No past-date bookings are marked unpaid." />
      </section>
    </> : null}
    {can("finance") ? <section aria-labelledby="financial-heading" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="financial-heading" className="text-xl font-black">Financial snapshot</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Loaded, non-archived bookings across all dates; expenses across all dates. Currencies are shown separately.</p></div><Link href="/admin/finance" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-cyan-800">Monthly finance <ArrowRight size={15} /></Link></div>
      {!canReadBookings ? <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Booking revenue and balances are unavailable with your current access. Recorded expenses are shown below.</p> : null}
      <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {canReadBookings ? <><MoneyMetric label="Booked value" value={metrics.projectedByCurrency} note="Excludes cancelled and refunded bookings" /><MoneyMetric label="Marked paid" value={metrics.collectedByCurrency} note="Includes paid bookings later cancelled" /><MoneyMetric label="Unpaid balance" value={work.outstandingByCurrency} note={`${work.unpaid.length} active unpaid bookings`} /></> : null}
        <MoneyMetric label="Recorded expenses" value={metrics.expenseByCurrency} note="All loaded expense records" />
        {canReadBookings ? <MoneyMetric label="Cash less expenses" value={metrics.profitByCurrency} note="Marked paid minus recorded expenses" /> : null}
      </dl>
    </section> : null}
    {can("content") ? <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-black">Recent listing activity</h2><Link href="/admin/trips" className="text-sm font-bold text-cyan-800">Manage listings</Link></div>{tripChanges.length ? <ul className="mt-3 divide-y divide-slate-100">{tripChanges.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span className="font-medium text-slate-800">{item.title}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-600">{item.listing_status}</span></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No recent listing visibility changes.</p>}</section> : null}
    <section aria-labelledby="workspaces-heading">
      <h2 id="workspaces-heading" className="text-xl font-black text-slate-950">Your workspaces</h2>
      <p className="mt-1 text-sm text-slate-500">Go straight to the tools for your next task.</p>
      <div className="mt-4 grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">{workspaces.map((group) => <div key={group.label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">{group.label}</h3>
        <ul className="mt-3 divide-y divide-slate-100">{group.sections.map((section) => <li key={section.label} className="py-2">
          <Link href={section.pages[0].href} className="flex min-h-11 items-center justify-between gap-2 rounded-lg text-sm font-bold text-slate-900 hover:text-cyan-800"><span>{section.label}</span><ArrowRight size={16} className="shrink-0" /></Link>
          {section.pages.length > 1 ? <div className="flex flex-wrap gap-x-3">{section.pages.slice(1).map((page) => <Link key={page.href} href={page.href} className="inline-flex min-h-11 items-center text-xs font-semibold text-cyan-800 underline decoration-cyan-200 underline-offset-4">{page.label}</Link>)}</div> : null}
        </li>)}</ul>
      </div>)}</div>
      {!workspaces.length ? <p className="mt-4 rounded-xl bg-white p-5 text-sm text-slate-600">No workspaces are assigned to this account. Ask your administrator to review your access.</p> : null}
    </section>
  </div>;
}

function AttentionList({ attention }: { attention: AdminAttention }) {
  const { items, tomorrow } = attention;
  return <section aria-labelledby="attention-heading" className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5">
      <div><h2 id="attention-heading" className="text-lg font-black">Needs attention</h2><p className="mt-1 text-sm text-slate-500">Dispatch gaps, silent suppliers and failed messages. Confirmations and unpaid trips are counted below.</p></div>
      {tomorrow ? <Link href={tomorrow.href} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-50 px-3 text-sm font-bold text-slate-700 hover:bg-cyan-50 hover:text-cyan-900"><Truck size={16} className="text-cyan-700" aria-hidden="true" />Tomorrow&rsquo;s pickups: {tomorrow.bookings} booking{tomorrow.bookings === 1 ? "" : "s"} · {tomorrow.guests} guest{tomorrow.guests === 1 ? "" : "s"}<ArrowRight size={15} aria-hidden="true" /></Link> : null}
    </div>
    {items.length ? <ul className="divide-y divide-slate-100">{items.map((item) => <li key={item.id} className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3"><AlertTriangle size={19} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" /><div className="min-w-0"><h3 className="text-sm font-bold text-slate-900">{item.label} <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold tabular-nums text-amber-900">{item.count}</span></h3><p className="mt-1 text-xs leading-5 text-slate-500">{item.note}</p></div></div>
        <Link href={item.href} className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-cyan-800">{item.linkLabel} <ArrowRight size={15} aria-hidden="true" /></Link>
      </div>
      <ul className="mt-2 space-y-1 pl-8">{item.entries.map((entry) => <li key={entry.key}><Link href={entry.href} className="block rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-cyan-700"><span className="font-semibold text-slate-800">{entry.title}</span><span className="block break-words text-xs text-slate-500">{entry.detail}</span></Link></li>)}</ul>
      {item.count > item.entries.length ? <p className="mt-1 pl-10 text-xs text-slate-500">+{item.count - item.entries.length} more</p> : null}
    </li>)}</ul> : <p className="flex items-start gap-3 p-5 text-sm leading-6 text-slate-500"><CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />Nothing needs attention right now.</p>}
  </section>;
}

function WorkMetric({ label, value, note, icon, attention = false }: { label: string; value: number | string; note: string; icon: React.ReactNode; attention?: boolean }) {
  return <div className={`rounded-2xl border p-4 sm:p-5 ${attention ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}><div className={`mb-3 ${attention ? "text-amber-700" : "text-cyan-700"}`}>{icon}</div><p className="text-3xl font-black tabular-nums text-slate-950">{value}</p><h3 className="mt-1 text-sm font-bold text-slate-800">{label}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{note}</p></div>;
}

function BookingQueue({ bookings, day, onOpen, empty }: { bookings: OverviewBooking[]; day: string; onOpen: (id: string) => void; empty: string }) {
  if (!bookings.length) return <p className="flex items-start gap-3 p-5 text-sm leading-6 text-slate-500"><CheckCircle2 size={20} className="mt-1 shrink-0 text-emerald-600" />{empty}</p>;
  return <ul className="divide-y divide-slate-100">{bookings.map((booking, index) => <li key={`${booking.id}-${index}`}><button type="button" onClick={() => onOpen(booking.id)} className="flex w-full items-center gap-3 p-5 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cyan-700"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs font-bold text-cyan-800">{booking.reference}</span><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${booking.status === "new" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>{booking.status === "new" ? "Needs confirmation" : booking.status === "completed" ? "Completed" : "Confirmed"}</span></div><p className="mt-1 break-words text-sm font-bold text-slate-900">{booking.tour_name || "Transfer"}</p><p className="mt-1 break-words text-xs text-slate-500">{booking.customer_name} · {overviewGuestCount(booking) == null ? "Guests not recorded" : `${overviewGuestCount(booking)} guest${overviewGuestCount(booking) === 1 ? "" : "s"}`}</p><p className="mt-2 text-xs font-semibold text-slate-600">{booking.date === day ? "Today" : booking.date || "Date not set"}{booking.date && booking.date < day ? " · Past trip date" : ""}</p></div><ArrowRight size={18} className="shrink-0 text-slate-400" /></button></li>)}</ul>;
}

function MoneyMetric({ label, value, note }: { label: string; value: Record<string, number>; note: string }) {
  return <div className="min-w-0 rounded-xl bg-slate-50 p-4"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-2 break-words text-xl font-black text-slate-900">{moneyBreakdown(value)}</dd><dd className="mt-2 text-xs leading-5 text-slate-500">{note}</dd></div>;
}
