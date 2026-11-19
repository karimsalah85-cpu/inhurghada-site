"use client";

import { type FormEvent, useState } from "react";

type QuotedBooking = { id: string; amount: number | string; subtotal?: number | string | null; pricing_snapshot?: unknown; date: string | null; notes: string | null } & Record<string, unknown>;
type Result = { booking: QuotedBooking; email: { attempted: boolean; sent: boolean; recipient?: string; reason?: string }; whatsappLink: string | null };

/**
 * Quote a transfer the website could not price itself: staff enter the price, which is saved on
 * the booking, and the customer gets the quotation by email (and on WhatsApp from staff's phone).
 */
export default function TransferQuotation({ bookingId, currency, amount, pending, customerEmail, hasPhone, onQuoted }: {
  bookingId: string;
  currency: string;
  amount: number;
  pending: boolean;
  customerEmail?: string | null;
  hasPhone: boolean;
  onQuoted?: (booking: QuotedBooking) => void;
}) {
  const [price, setPrice] = useState(pending || !amount ? "" : String(amount));
  const [message, setMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(Boolean(customerEmail));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const money = (value: number) => new Intl.NumberFormat("en", { style: "currency", currency: currency || "USD" }).format(value);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = Number(price);
    if (!Number.isFinite(value) || value <= 0) { setError("Enter the transfer price, more than 0."); return; }
    if (!pending && !window.confirm(`Change the quoted price from ${money(amount)} to ${money(value)}${sendEmail ? " and email the customer the new quotation" : ""}?`)) return;
    setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/quote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ price: value, message, sendEmail }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not send the quotation.");
      setResult(data as Result);
      onQuoted?.((data as Result).booking);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not send the quotation."); }
    finally { setBusy(false); }
  }

  return <section aria-labelledby={`quote-${bookingId}`} className={`rounded-2xl border-2 p-5 ${pending ? "border-orange-300 bg-orange-50" : "border-slate-200 bg-white"}`}>
    <h3 id={`quote-${bookingId}`} className="text-xs font-black uppercase tracking-wider text-orange-900">{pending ? "Quotation needed" : "Transfer quotation"}</h3>
    <p className="mt-1 text-sm text-slate-700">{pending
      ? "The website could not price this transfer, so the customer is waiting for a quote. Enter the total for the vehicle(s) and send it."
      : `Quoted at ${money(amount)}. You can change it until the booking is paid.`}</p>
    <form onSubmit={submit} className="mt-4 space-y-3">
      <label className="block text-sm font-semibold">Total price ({currency || "USD"}), for the whole transfer — not per person
        <input type="number" min={0.01} step="0.01" inputMode="decimal" required value={price} onChange={(event) => setPrice(event.target.value)} className="mt-1 w-full rounded-xl border bg-white p-2" />
      </label>
      <label className="block text-sm font-semibold">Message to the customer (optional)
        <textarea maxLength={1000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="e.g. Includes a 14-seat minibus and child seats." className="mt-1 min-h-16 w-full rounded-xl border bg-white p-2 font-normal" />
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={sendEmail} disabled={!customerEmail} onChange={(event) => setSendEmail(event.target.checked)} />
        {customerEmail ? <>Email the quotation to <span className="break-all font-normal">{customerEmail}</span></> : "No email address on this booking — send it on WhatsApp after saving"}
      </label>
      <button disabled={busy} className="w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-60">{busy ? "Saving…" : sendEmail ? "Save price and send quotation" : "Save price"}</button>
    </form>
    {error ? <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
    {result ? <div role="status" className="mt-3 space-y-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
      <p className="font-semibold">Price saved: {money(Number(result.booking.amount))}.</p>
      {result.email.attempted ? <p>{result.email.sent ? `Quotation emailed to ${result.email.recipient}.` : "The price is saved, but the email could not be sent. Send the quotation on WhatsApp instead, or try again."}</p> : null}
      {result.whatsappLink ? <a href={result.whatsappLink} target="_blank" rel="noreferrer" className="inline-block rounded-lg bg-emerald-700 px-3 py-2 font-bold text-white">Send quotation on WhatsApp</a> : hasPhone ? null : <p>No phone number on this booking for WhatsApp.</p>}
    </div> : null}
  </section>;
}
