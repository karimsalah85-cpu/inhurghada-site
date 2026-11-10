"use client";

import { useState } from "react";
import Link from "next/link";
import { money } from "@/lib/admin-money";
import { overviewGuestCount, type OverviewBooking } from "@/lib/admin-overview";

/** Reports access can inspect search results without offering booking-edit actions. */
export default function ReadOnlyBookings({ bookings, month, search }: { bookings: OverviewBooking[]; month: string; search: string }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(bookings.length / 50));
  const currentPage = Math.min(page, pages - 1);
  return <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6" aria-labelledby="read-only-bookings-heading">
    <h2 id="read-only-bookings-heading" className="text-lg font-black">Booking search · read only</h2>
    <p className="mt-1 text-sm text-slate-600">Your reports access lets you view bookings. Changes require booking permission.</p>
    <form action="/admin/bookings" className="mt-4 flex flex-wrap items-end gap-3">
      <input type="hidden" name="archive" value="all" />
      <label className="text-sm font-bold">Trip month<input type="month" name="month" defaultValue={month} className="mt-1 block min-h-11 rounded-lg border border-slate-300 px-3" /></label>
      <label className="min-w-0 flex-1 text-sm font-bold">Reference or guest<input type="search" name="search" defaultValue={search} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
      <button type="submit" className="min-h-11 rounded-lg bg-cyan-800 px-4 font-bold text-white">Search</button>
      <Link href="/admin/reports" className="inline-flex min-h-11 items-center text-sm font-bold text-cyan-800">Full booking reports</Link>
    </form>
    <p role="status" className="mt-4 text-sm text-slate-500">{bookings.length} matching bookings · page {currentPage + 1} of {pages}</p>
    <ul className="mt-3 divide-y divide-slate-100">{bookings.slice(currentPage * 50, (currentPage + 1) * 50).map((booking) => <li key={booking.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
      <div className="min-w-0"><p className="break-words font-mono text-sm font-bold text-cyan-800">{booking.reference}</p><p className="break-words font-bold">{booking.customer_name}</p><p className="break-words text-sm text-slate-600">{booking.tour_name || "Transfer"} · {booking.date || "Date not set"}</p><p className="text-xs text-slate-500">{overviewGuestCount(booking) ?? "Unknown"} guests · {booking.status} · {booking.payment_status}{booking.archived_at ? " · archived" : ""}</p></div>
      <p className="font-bold">{money(Number(booking.amount), booking.currency)}</p>
    </li>)}</ul>
    {!bookings.length ? <p className="py-5 text-sm text-slate-600">No bookings match these filters.</p> : null}
    {pages > 1 ? <div className="mt-4 flex gap-3"><button type="button" disabled={!currentPage} onClick={() => setPage(currentPage - 1)} className="min-h-11 rounded-lg border px-4 font-bold disabled:opacity-40">Previous</button><button type="button" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)} className="min-h-11 rounded-lg border px-4 font-bold disabled:opacity-40">Next</button></div> : null}
  </section>;
}
