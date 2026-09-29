"use client";

import { useCallback, useEffect, useState } from "react";
import BookingPayments from "@/components/admin/finance/BookingPayments";
import { subscribeToAdminBookingChanges } from "@/lib/admin-booking-events";
import { formatMoney, fromMinor, isFinanceCurrency, toMinor } from "@/lib/finance/money";

type Row = {
  booking_id: string; reference: string; customer_name: string; tour_name: string | null; trip_date: string | null;
  amount: string | number; currency: string; status: string; payment_status: string; reason: "marked_paid" | "marked_refunded" | "trip_done_unpaid";
};
const reasonText: Record<Row["reason"], [string, string]> = {
  marked_paid: ["Marked paid, no payment recorded", "bg-amber-100 text-amber-900"],
  marked_refunded: ["Marked refunded, nothing recorded", "bg-sky-100 text-sky-900"],
  trip_done_unpaid: ["Trip done, no payment recorded", "bg-rose-100 text-rose-900"],
};
const dateLabel = (day: string | null) => (day ? new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "No date");
const amountLabel = (row: Row) => (isFinanceCurrency(row.currency) ? formatMoney(fromMinor(toMinor(row.amount)), row.currency) : `${row.amount} ${row.currency}`);

export default function FinancePaymentsToRecord() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/finance/payments-to-record", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Could not load the list.");
    setRows(body.rows); setCanManage(Boolean(body.canManage)); setError("");
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the list is loaded from the protected API after mount
  useEffect(() => { load().catch((reason: Error) => setError(reason.message)); }, [load]);
  // A payment recorded in the form below drops its booking from the list.
  useEffect(() => subscribeToAdminBookingChanges(() => { load().catch((reason: Error) => setError(reason.message)); }), [load]);

  if (error) return <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>;
  if (!rows) return <p role="status" className="text-sm">Loading…</p>;
  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-white p-4 text-sm text-slate-600 shadow-sm sm:p-6">
        <p>From now on, record every guest payment when it happens: deposit, balance or refund, with the method and date. Once a booking has a recorded payment, its payment status follows the money and the booking leaves this list. Trips the partner collects are not listed: the guest pays the partner, and Daily Red Sea&apos;s share is settled on the partner&apos;s page.</p>
      </section>
      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.booking_id} className="rounded-3xl bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold text-cyan-800">{row.reference}</p>
                  <p className="font-semibold">{row.customer_name}</p>
                  <p className="text-sm text-slate-600">{row.tour_name || "Private transfer"} · {dateLabel(row.trip_date)}</p>
                  <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${reasonText[row.reason][1]}`}>{reasonText[row.reason][0]}</span>
                </div>
                <div className="text-right">
                  <p className="whitespace-nowrap text-lg font-black">{amountLabel(row)}</p>
                  {canManage ? (
                    <button type="button" aria-expanded={open === row.booking_id} onClick={() => setOpen(open === row.booking_id ? null : row.booking_id)} className="mt-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">
                      {open === row.booking_id ? "Close" : row.reason === "marked_refunded" ? "Record payment & refund" : "Record payment"}
                    </button>
                  ) : null}
                </div>
              </div>
              {open === row.booking_id ? <div className="mt-4 border-t border-slate-100 pt-4"><BookingPayments bookingId={row.booking_id} bookingCurrency={row.currency} /></div> : null}
            </li>
          ))}
        </ul>
      ) : <p className="rounded-3xl bg-white p-6 text-sm text-slate-600 shadow-sm">Nothing to record: every booking Daily Red Sea collects has its payments recorded.</p>}
    </div>
  );
}
