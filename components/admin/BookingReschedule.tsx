"use client";
import { useMemo, useState } from "react";
import { CalendarClock, Send } from "lucide-react";
import { bookingTrips, type ReschedulableBooking } from "@/lib/booking-reschedule";

export type RescheduledBooking = { id: string; date: string | null; notes: string | null } & Record<string, unknown>;
type Detail = ReschedulableBooking & { start_time?: string | null };
type Result = {
  booking: RescheduledBooking;
  changed: boolean;
  notification: { attempted: boolean; sent: boolean };
  supplierRequests: number;
  error?: string;
};

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });

/** Staff move a booking to another date and (re)send the booking email with its PDF. */
export default function BookingReschedule({ bookingId, status, customerEmail, detail, onChanged }: {
  bookingId: string;
  status?: string;
  customerEmail?: string | null;
  detail: Detail;
  onChanged: (booking: RescheduledBooking) => void | Promise<void>;
}) {
  const trips = useMemo(() => bookingTrips(detail), [detail]);
  const hasTime = Boolean(detail.start_time);
  const emailable = Boolean(customerEmail) && (status === "new" || status === "confirmed");
  const [tripIndex, setTripIndex] = useState(0);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState<"save" | "resend" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const trip = trips[tripIndex] ?? trips[0];
  const currentTime = detail.start_time?.slice(0, 5) || "";
  const newDate = date || trip.date || "";
  const newTime = time || currentTime;
  const unchanged = newDate === (trip.date || "") && newTime === currentTime;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!newDate || unchanged) return;
    setBusy("save"); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newDate,
          start_time: hasTime && newTime !== currentTime ? newTime : null,
          trip_index: trips.length > 1 ? trip.index : null,
          notify: notify && emailable,
        }),
      });
      const result = await response.json() as Result;
      if (!response.ok) throw new Error(result.error || "Could not change the booking date.");
      setDate(""); setTime("");
      setNotice([
        `Moved to ${newDate}${hasTime ? ` at ${newTime}` : ""}.`,
        result.notification.attempted
          ? result.notification.sent
            ? `The updated booking and PDF were emailed to ${customerEmail}.`
            : "The customer email could not be sent — use “Resend booking email” below."
          : "The customer was not emailed.",
        result.supplierRequests > 0
          ? `${result.supplierRequests} supplier request${result.supplierRequests === 1 ? " was" : "s were"} sent with the old date — resend ${result.supplierRequests === 1 ? "it" : "them"} in the suppliers section.`
          : "",
      ].filter(Boolean).join(" "));
      await onChanged(result.booking);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not change the booking date.");
    } finally {
      setBusy(null);
    }
  }

  async function resend() {
    if (!customerEmail || !window.confirm(`Resend the current booking email and PDF to ${customerEmail}?`)) return;
    setBusy("resend"); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/email`, { method: "POST" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not send the booking email.");
      setNotice(`Booking email and PDF sent to ${customerEmail}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not send the booking email.");
    } finally {
      setBusy(null);
    }
  }

  const input = "mt-1 w-full rounded-xl border bg-white p-2";
  return (
    <section aria-labelledby="booking-reschedule-title" className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-5">
      <b id="booking-reschedule-title" className="text-xs uppercase tracking-wider text-sky-900">Change date · resend booking</b>
      <form onSubmit={save} className="mt-3 grid gap-3 sm:grid-cols-2">
        {trips.length > 1 ? (
          <label className="text-sm font-semibold sm:col-span-2">Trip
            <select value={tripIndex} onChange={(event) => { setTripIndex(Number(event.target.value)); setDate(""); }} disabled={busy !== null} className={input}>
              {trips.map((option) => <option key={option.index} value={option.index}>{option.name} · {option.date || "date pending"}</option>)}
            </select>
          </label>
        ) : null}
        <label className="text-sm font-semibold">New date
          <input type="date" required value={newDate} onChange={(event) => setDate(event.target.value)} disabled={busy !== null} className={input} />
        </label>
        {hasTime ? (
          <label className="text-sm font-semibold">Pickup time
            <input type="time" required value={newTime} onChange={(event) => setTime(event.target.value)} disabled={busy !== null} className={input} />
          </label>
        ) : null}
        {newDate && newDate < today() ? <p className="text-sm text-amber-800 sm:col-span-2">This date is in the past.</p> : null}
        <label className="flex items-start gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={notify && emailable} onChange={(event) => setNotify(event.target.checked)} disabled={!emailable || busy !== null} className="mt-1" />
          <span>
            {emailable
              ? <>Email the updated booking and PDF to <span className="break-all font-semibold">{customerEmail}</span></>
              : !customerEmail
                ? "No customer email on this booking — tell the customer by phone or WhatsApp."
                : "Completed and cancelled bookings are not emailed about a date change."}
          </span>
        </label>
        <button disabled={busy !== null || !newDate || unchanged} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 p-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 sm:col-span-2">
          <CalendarClock size={16} />{busy === "save" ? "Saving…" : "Save new date"}
        </button>
      </form>
      <button type="button" onClick={resend} disabled={!customerEmail || busy !== null} title={customerEmail ? "Send the current booking email with the customer PDF again" : "Customer email unavailable"} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white p-2 text-sm font-bold text-slate-900 disabled:cursor-not-allowed disabled:opacity-40">
        <Send size={16} />{busy === "resend" ? "Sending…" : "Resend booking email + PDF"}
      </button>
      {error ? <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p> : null}
      {notice ? <p className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-800" role="status">{notice}</p> : null}
    </section>
  );
}
