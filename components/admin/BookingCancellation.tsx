"use client";

import { useState, type FormEvent } from "react";
import { notifyAdminBookingsChanged } from "@/lib/admin-booking-events";

const reasons = [["weather", "Weather"], ["guest", "Guest cancelled"], ["partner", "Partner cancelled"], ["other", "Other"]] as const;

/** Why a cancelled booking was cancelled; feeds the monthly cancellation-cost report. */
export default function BookingCancellation({ bookingId, reason, note, cancelledAt }: {
  bookingId: string; reason: string | null; note: string | null; cancelledAt: string | null;
}) {
  const [saved, setSaved] = useState({ reason: reason || "", note: note || "" });
  const [form, setForm] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage(null);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancellation_reason: form.reason, cancellation_note: form.note }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save the reason.");
      setSaved(form);
      setMessage({ tone: "ok", text: "Cancellation reason saved." });
      notifyAdminBookingsChanged();
    } catch (reason) {
      setMessage({ tone: "error", text: reason instanceof Error ? reason.message : "Could not save the reason." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="cancellation-title" className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <b id="cancellation-title" className="text-xs uppercase tracking-wider text-rose-900">Cancellation</b>
        {cancelledAt ? <span className="text-xs text-rose-900">Cancelled {new Date(cancelledAt).toLocaleString("en-GB", { timeZone: "Africa/Cairo", dateStyle: "medium", timeStyle: "short" })}</span> : null}
      </div>
      {!saved.reason ? <p className="mt-2 text-sm font-semibold text-rose-900">No reason recorded yet — it shows as “unspecified” in the cancellation report.</p> : null}
      <form onSubmit={save} className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr]">
        <label className="text-sm font-semibold">Reason
          <select required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-base font-normal sm:text-sm">
            <option value="" disabled>Choose…</option>
            {reasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Note <span className="font-normal text-slate-500">optional</span>
          <input maxLength={500} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })}
            placeholder="e.g. Port closed by coastguard" className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-base font-normal sm:text-sm" />
        </label>
        <button disabled={busy || !form.reason || (form.reason === saved.reason && form.note === saved.note)}
          className="rounded-xl bg-rose-700 p-3 font-bold text-white disabled:opacity-50 sm:col-span-2">{busy ? "Saving…" : "Save reason"}</button>
      </form>
      {message ? <p role={message.tone === "error" ? "alert" : "status"} className={`mt-2 text-sm ${message.tone === "error" ? "text-rose-800" : "text-emerald-800"}`}>{message.text}</p> : null}
    </section>
  );
}
