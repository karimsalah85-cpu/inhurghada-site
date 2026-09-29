"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { RotateCcw } from "lucide-react";
import { notifyAdminBookingsChanged } from "@/lib/admin-booking-events";
import { FINANCE_CURRENCIES, formatMoney, fromMinor, isFinanceCurrency, toMinor, type FinanceCurrency } from "@/lib/finance/money";

/** numeric columns arrive as JSON numbers or strings depending on size; money math stays in cents. */
type Amount = string | number;
type Summary = {
  currency: string; total: Amount; received: Amount; refunded_cash: Amount; refunded_credit: Amount; net_paid: Amount;
  outstanding: Amount; payment_state: string; entries: number;
};
type Entry = {
  id: string; kind: string; method: string; amount: Amount; currency: string; booking_currency: string; applied_amount: Amount;
  paid_on: string; reference: string | null; note: string | null; is_reversal: boolean; reverses_entry_id: string | null;
  created_by_email: string; credit_note_id: string | null;
};
type CreditNote = { id: string; number: string; currency: string; amount: Amount; remaining: Amount; status: string; expires_on: string | null };
type Data = { summary: Summary; entries: Entry[]; creditNotes: CreditNote[]; canManage: boolean };

const kindLabels: Record<string, string> = {
  deposit: "Deposit", balance: "Balance payment", refund: "Refund", credit_note_issued: "Credit note issued", credit_redemption: "Paid by credit note",
};
const methodLabels: Record<string, string> = {
  cash: "Cash", card: "Card", stripe: "Stripe", bank_transfer: "Bank transfer", paypal: "PayPal", instapay: "InstaPay",
  vodafone_cash: "Vodafone Cash", credit_note: "Credit note", other: "Other",
};
const stateStyles: Record<string, [string, string]> = {
  unpaid: ["Unpaid", "bg-rose-100 text-rose-800"],
  deposit_paid: ["Deposit paid", "bg-amber-100 text-amber-800"],
  paid: ["Paid", "bg-emerald-100 text-emerald-800"],
  partly_refunded: ["Partly refunded", "bg-sky-100 text-sky-800"],
  refunded: ["Refunded", "bg-slate-200 text-slate-800"],
};
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
const newKey = () => crypto.randomUUID();
const field = "mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-base font-normal sm:text-sm";

async function send(url: string, body: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Nothing was saved.");
  return data;
}

/** Guest money for one booking: what was paid, refunded and still owed, with the forms to record it. Finance staff only. */
export default function BookingPayments({ bookingId, bookingCurrency }: { bookingId: string; bookingCurrency: string }) {
  const currency: FinanceCurrency = isFinanceCurrency(bookingCurrency?.toUpperCase()) ? bookingCurrency.toUpperCase() as FinanceCurrency : "USD";
  const [data, setData] = useState<Data | null>(null);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"payment" | "credit" | "redeem">("payment");
  const [payment, setPayment] = useState({ key: newKey(), kind: "deposit", amount: "", currency: currency as string, method: "cash", paid_on: today(), applied_amount: "", reference: "", note: "" });
  const [credit, setCredit] = useState({ key: newKey(), amount: "", issued_on: today(), expires_on: "", reason: "" });
  const [redeem, setRedeem] = useState({ key: newKey(), credit_note: "", amount: "", paid_on: today(), applied_amount: "" });

  const load = useCallback(async () => {
    const response = await fetch(`/api/admin/finance/bookings/${bookingId}/payments`, { cache: "no-store" });
    if (response.status === 401 || response.status === 403) { setHidden(true); return; }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Could not load payments.");
    setData(body);
  }, [bookingId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- payments are loaded from the protected API after mount
  useEffect(() => { load().catch((reason: Error) => setError(reason.message)); }, [load]);

  async function run(work: () => Promise<unknown>, done: string, reset: () => void) {
    setBusy(true); setError(""); setNotice("");
    try {
      await work();
      reset();
      setNotice(done);
      notifyAdminBookingsChanged();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Nothing was saved.");
    } finally {
      setBusy(false);
    }
  }

  function submitPayment(event: FormEvent) {
    event.preventDefault();
    const { key, ...body } = payment;
    void run(() => send(`/api/admin/finance/bookings/${bookingId}/payments`, { ...body, idempotency_key: key }),
      `${kindLabels[payment.kind]} recorded.`,
      () => setPayment({ ...payment, key: newKey(), amount: "", applied_amount: "", reference: "", note: "" }));
  }
  function submitCredit(event: FormEvent) {
    event.preventDefault();
    const { key, ...body } = credit;
    void run(() => send(`/api/admin/finance/bookings/${bookingId}/credit-notes`, { ...body, idempotency_key: key }),
      "Credit note issued.", () => setCredit({ ...credit, key: newKey(), amount: "", reason: "" }));
  }
  function submitRedeem(event: FormEvent) {
    event.preventDefault();
    const { key, ...body } = redeem;
    void run(() => send(`/api/admin/finance/bookings/${bookingId}/credit-redemptions`, { ...body, idempotency_key: key }),
      "Credit note applied.", () => setRedeem({ ...redeem, key: newKey(), credit_note: "", amount: "", applied_amount: "" }));
  }
  function reverseEntry(entry: Entry) {
    const note = window.prompt(`Reverse this ${kindLabels[entry.kind].toLowerCase()} of ${formatMoney(fromMinor(-toMinor(entry.amount)), entry.currency as FinanceCurrency)}? A reversing entry is added; nothing is deleted. Reason:`);
    if (note === null) return;
    if (note.trim().length < 3) { setError("Enter a reason (at least 3 characters) for the reversal."); return; }
    void run(() => send(`/api/admin/finance/payments/${entry.id}/reverse`, { note: note.trim() }), "Entry reversed.", () => undefined);
  }

  if (hidden) return null;
  const summary = data?.summary;
  const reversed = new Set(data?.entries.filter((entry) => entry.reverses_entry_id).map((entry) => entry.reverses_entry_id));
  const [stateLabel, stateClass] = stateStyles[summary?.payment_state ?? ""] ?? [summary?.payment_state ?? "", "bg-slate-100 text-slate-700"];
  const show = (amount: Amount, code: string = currency) => formatMoney(fromMinor(toMinor(amount)), code as FinanceCurrency);

  return (
    <section aria-labelledby="booking-payments-title" className="rounded-2xl border-2 border-violet-200 bg-violet-50 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <b id="booking-payments-title" className="text-xs uppercase tracking-wider text-violet-900">Guest payments</b>
        {summary ? <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${stateClass}`}>{stateLabel}</span> : null}
      </div>
      {error ? <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {notice ? <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p> : null}
      {!data || !summary ? <p role="status" className="mt-3 text-sm">{error ? "" : "Loading payments…"}</p> : (
        <>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            {([["Total", summary.total], ["Received", summary.received], ["Refunded", fromMinor(toMinor(summary.refunded_cash) + toMinor(summary.refunded_credit))], ["Outstanding", summary.outstanding]] as const).map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white p-3">
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="font-bold">{show(value)}</dd>
              </div>
            ))}
          </dl>
          {toMinor(summary.refunded_credit) > 0n ? <p className="mt-2 text-xs text-slate-600">Includes {show(summary.refunded_credit)} given as credit notes.</p> : null}

          <h3 className="mt-5 font-bold">History</h3>
          {data.entries.length ? (
            <ul className="mt-2 space-y-2">
              {data.entries.map((entry) => {
                const outgoing = toMinor(entry.amount) < 0n;
                return (
                  <li key={entry.id} className={`flex items-start justify-between gap-3 rounded-xl bg-white p-3 text-sm ${entry.is_reversal || reversed.has(entry.id) ? "opacity-70" : ""}`}>
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {entry.is_reversal ? "Reversal of " : ""}{kindLabels[entry.kind] ?? entry.kind}
                        {reversed.has(entry.id) ? <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">Reversed</span> : null}
                      </p>
                      <p className="text-xs text-slate-500">
                        {entry.paid_on} · {methodLabels[entry.method] ?? entry.method}{entry.reference ? ` · ${entry.reference}` : ""} · {entry.created_by_email}
                      </p>
                      {entry.note ? <p className="mt-1 text-xs text-slate-600 wrap-break-word">{entry.note}</p> : null}
                    </div>
                    <div className="flex shrink-0 items-start gap-1">
                      <div className="text-right">
                        <p className={`font-bold ${outgoing ? "text-rose-700" : "text-emerald-700"}`}>{show(entry.amount, entry.currency)}</p>
                        {entry.currency !== entry.booking_currency ? <p className="text-xs text-slate-500">= {show(entry.applied_amount, entry.booking_currency)}</p> : null}
                      </div>
                      {data.canManage && !entry.is_reversal && !reversed.has(entry.id) ? (
                        <button type="button" disabled={busy} onClick={() => reverseEntry(entry)} aria-label={`Reverse ${kindLabels[entry.kind]} on ${entry.paid_on}`} title="Reverse"
                          className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-40">
                          <RotateCcw size={16} />
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : <p className="mt-2 rounded-xl bg-white p-3 text-sm text-slate-500">No payments recorded yet. The booking&apos;s payment status is set by hand until the first one is recorded.</p>}

          {data.creditNotes.length ? (
            <>
              <h3 className="mt-5 font-bold">Credit notes from this booking</h3>
              <ul className="mt-2 space-y-2">
                {data.creditNotes.map((note) => (
                  <li key={note.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 text-sm">
                    <div>
                      <p className="font-mono font-semibold">{note.number}</p>
                      <p className="text-xs capitalize text-slate-500">{note.status.replace("_", " ")}{note.expires_on ? ` · expires ${note.expires_on}` : ""}</p>
                    </div>
                    <p className="text-right font-bold">{show(note.remaining, note.currency)}<span className="block text-xs font-normal text-slate-500">of {show(note.amount, note.currency)}</span></p>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {data.canManage ? (
            <div className="mt-5 rounded-xl bg-white p-3 sm:p-4">
              <div role="tablist" aria-label="Record" className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold sm:text-sm">
                {([["payment", "Payment / refund"], ["credit", "Issue credit"], ["redeem", "Use credit"]] as const).map(([key, label]) => (
                  <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
                    className={`rounded-lg px-2 py-2.5 ${tab === key ? "bg-white text-violet-800 shadow-sm" : "text-slate-600"}`}>{label}</button>
                ))}
              </div>

              {tab === "payment" ? (
                <form onSubmit={submitPayment} className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-semibold">Type
                    <select value={payment.kind} onChange={(event) => setPayment({ ...payment, kind: event.target.value })} className={field}>
                      <option value="deposit">Deposit</option><option value="balance">Balance payment</option><option value="refund">Refund to guest</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold">Method
                    <select value={payment.method} onChange={(event) => setPayment({ ...payment, method: event.target.value })} className={field}>
                      {Object.entries(methodLabels).filter(([key]) => key !== "credit_note").map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-semibold">Amount
                    <input required inputMode="decimal" pattern="\d+(\.\d{1,2})?" value={payment.amount} onChange={(event) => setPayment({ ...payment, amount: event.target.value })} className={field} />
                  </label>
                  <label className="text-sm font-semibold">Currency paid
                    <select value={payment.currency} onChange={(event) => setPayment({ ...payment, currency: event.target.value, applied_amount: "" })} className={field}>
                      {FINANCE_CURRENCIES.map((code) => <option key={code}>{code}</option>)}
                    </select>
                  </label>
                  {payment.currency !== currency ? (
                    <label className="text-sm font-semibold sm:col-span-2">Covers how much in {currency}? <span className="font-normal text-slate-500">optional — blank uses the day&apos;s rate</span>
                      <input inputMode="decimal" pattern="\d+(\.\d{1,2})?" value={payment.applied_amount} onChange={(event) => setPayment({ ...payment, applied_amount: event.target.value })} className={field} />
                    </label>
                  ) : null}
                  <label className="text-sm font-semibold">Date
                    <input required type="date" max={today()} value={payment.paid_on} onChange={(event) => setPayment({ ...payment, paid_on: event.target.value })} className={field} />
                  </label>
                  <label className="text-sm font-semibold">Reference <span className="font-normal text-slate-500">optional</span>
                    <input maxLength={120} placeholder="Receipt or transaction no." value={payment.reference} onChange={(event) => setPayment({ ...payment, reference: event.target.value })} className={field} />
                  </label>
                  <label className="text-sm font-semibold sm:col-span-2">Note <span className="font-normal text-slate-500">optional</span>
                    <input maxLength={1000} value={payment.note} onChange={(event) => setPayment({ ...payment, note: event.target.value })} className={field} />
                  </label>
                  <button disabled={busy} className="rounded-xl bg-violet-700 p-3 font-bold text-white disabled:opacity-60 sm:col-span-2">
                    {busy ? "Saving…" : payment.kind === "refund" ? "Record refund" : "Record payment"}
                  </button>
                </form>
              ) : null}

              {tab === "credit" ? (
                <form onSubmit={submitCredit} className="mt-4 grid gap-3 sm:grid-cols-2">
                  <p className="text-sm text-slate-600 sm:col-span-2">Gives the guest credit (in {currency}) instead of cash back, from money already paid on this booking.</p>
                  <label className="text-sm font-semibold">Amount ({currency})
                    <input required inputMode="decimal" pattern="\d+(\.\d{1,2})?" value={credit.amount} onChange={(event) => setCredit({ ...credit, amount: event.target.value })} className={field} />
                  </label>
                  <label className="text-sm font-semibold">Expires <span className="font-normal text-slate-500">optional</span>
                    <input type="date" min={credit.issued_on} value={credit.expires_on} onChange={(event) => setCredit({ ...credit, expires_on: event.target.value })} className={field} />
                  </label>
                  <label className="text-sm font-semibold sm:col-span-2">Reason
                    <input required minLength={3} maxLength={1000} placeholder="e.g. Cancelled for weather — rebook any trip" value={credit.reason} onChange={(event) => setCredit({ ...credit, reason: event.target.value })} className={field} />
                  </label>
                  <button disabled={busy} className="rounded-xl bg-violet-700 p-3 font-bold text-white disabled:opacity-60 sm:col-span-2">{busy ? "Saving…" : "Issue credit note"}</button>
                </form>
              ) : null}

              {tab === "redeem" ? (
                <form onSubmit={submitRedeem} className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-semibold">Credit note number
                    <input required autoCapitalize="characters" placeholder="CN-2026-0001" value={redeem.credit_note} onChange={(event) => setRedeem({ ...redeem, credit_note: event.target.value })} className={field} />
                  </label>
                  <label className="text-sm font-semibold">Amount to use <span className="font-normal text-slate-500">in the note&apos;s currency</span>
                    <input required inputMode="decimal" pattern="\d+(\.\d{1,2})?" value={redeem.amount} onChange={(event) => setRedeem({ ...redeem, amount: event.target.value })} className={field} />
                  </label>
                  <label className="text-sm font-semibold">Date
                    <input required type="date" max={today()} value={redeem.paid_on} onChange={(event) => setRedeem({ ...redeem, paid_on: event.target.value })} className={field} />
                  </label>
                  <label className="text-sm font-semibold">Covers in {currency} <span className="font-normal text-slate-500">only if the note is in another currency</span>
                    <input inputMode="decimal" pattern="\d+(\.\d{1,2})?" value={redeem.applied_amount} onChange={(event) => setRedeem({ ...redeem, applied_amount: event.target.value })} className={field} />
                  </label>
                  <button disabled={busy} className="rounded-xl bg-violet-700 p-3 font-bold text-white disabled:opacity-60 sm:col-span-2">{busy ? "Saving…" : "Apply credit note"}</button>
                </form>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
