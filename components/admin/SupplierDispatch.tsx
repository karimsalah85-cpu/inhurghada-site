"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Mail, MessageCircle, RefreshCw, Send, Wallet, XCircle } from "lucide-react";
import { paymentLabels, paymentMethods, statusLabels, type PaymentStatus, type RequestStatus } from "@/lib/supplier-dispatch";

type SupplierOption = { id: string; name: string; type: string | null; has_whatsapp: boolean; has_email: boolean; default_currency: string | null; payment_method: string | null };
type RequestEvent = { id: string; event_type: string; actor: string; note: string | null; metadata: Record<string, unknown>; created_at: string };
type SupplierRequest = {
  id: string; supplier_id: string; status: RequestStatus; payment_status: PaymentStatus; admin_note: string | null; supplier_note: string | null;
  amount_due: number | string | null; amount_due_currency: string | null; sent_at: string; last_sent_at: string; first_viewed_at: string | null;
  responded_at: string | null; responded_by: string | null; payment_amount: number | string | null; payment_currency: string | null;
  payment_method: string | null; payment_reference: string | null; payment_sent_at: string | null; payment_confirmed_at: string | null;
  supplier: { id: string; name: string; type: string | null; whatsapp: string | null; email: string | null } | null;
  link: string; manual_whatsapp_url: string | null; events: RequestEvent[];
};
type Payload = { requests: SupplierRequest[]; suppliers: SupplierOption[]; linked_supplier_ids: string[]; can_edit: boolean; can_record_payment: boolean };
type Delivery = { channel: "whatsapp" | "email"; success: boolean; reason?: string };

const statusTone: Record<RequestStatus, string> = {
  sent: "bg-sky-100 text-sky-900", confirmed: "bg-emerald-100 text-emerald-900", declined: "bg-rose-100 text-rose-900",
  change_requested: "bg-amber-100 text-amber-900", cancelled: "bg-slate-200 text-slate-700",
};
const paymentTone: Record<PaymentStatus, string> = {
  none: "bg-slate-100 text-slate-600", sent: "bg-sky-100 text-sky-900", received: "bg-emerald-100 text-emerald-900", disputed: "bg-rose-100 text-rose-900",
};
const eventLabels: Record<string, string> = {
  sent: "Sent", resent: "Resent", viewed: "Opened by supplier", confirmed: "Supplier confirmed", declined: "Supplier declined",
  change_requested: "Supplier asked for a change", cancelled: "Cancelled", manual_confirmed: "Confirmed (recorded by admin)",
  manual_declined: "Declined (recorded by admin)", payment_sent: "Payment sent", payment_received: "Supplier confirmed payment received",
  payment_disputed: "Supplier reported payment not received", delivery_failed: "Message failed",
};
const reasonLabels: Record<string, string> = {
  "missing-twilio-config": "WhatsApp sending is not configured on the server",
  "no-whatsapp-number": "no WhatsApp number", "no-email-address": "no email address",
  "twilio-63016": "WhatsApp needs an approved template outside the 24-hour window",
  "twilio-63003": "number is not on WhatsApp", "missing-email-config": "email sending is not configured",
};

const stamp = (value: string | null) => value ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Cairo" }).format(new Date(value)) : "";
const money = (amount: number | string | null, currency: string | null) => {
  if (amount == null || !currency) return "";
  try { return new Intl.NumberFormat("en", { style: "currency", currency }).format(Number(amount)); } catch { return `${amount} ${currency}`; }
};
const hoursSince = (value: string) => Math.floor((Date.now() - new Date(value).getTime()) / 3_600_000);

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as { error?: string }).error || "Request failed.");
  return data as T;
}

function deliverySummary(delivery: Delivery[]) {
  if (!delivery.length) return "Saved. Nothing was sent automatically — use “Open in WhatsApp” or copy the link.";
  return delivery.map((d) => `${d.channel === "whatsapp" ? "WhatsApp" : "Email"}: ${d.success ? "sent" : `failed (${reasonLabels[d.reason || ""] || d.reason || "unknown"})`}`).join(" · ");
}

export default function SupplierDispatch({ bookingId, bookingCurrency, bookingCancelled }: { bookingId: string; bookingCurrency: string; bookingCancelled: boolean }) {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ supplier_id: "", whatsapp: true, email: true, note: "", amount_due: "", amount_due_currency: bookingCurrency || "USD", include_guest_price: false });

  useEffect(() => {
    let active = true;
    call<Payload>(`/api/admin/bookings/${bookingId}/supplier-requests`)
      .then((payload) => { if (active) { setData(payload); setError(""); } })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Could not load supplier requests."); });
    return () => { active = false; };
  }, [bookingId]);

  const suppliers = data ? [...data.suppliers].sort((a, b) => Number(data.linked_supplier_ids.includes(b.id)) - Number(data.linked_supplier_ids.includes(a.id)) || a.name.localeCompare(b.name)) : [];
  const chosen = suppliers.find((s) => s.id === form.supplier_id);

  function pickSupplier(id: string) {
    const s = suppliers.find((option) => option.id === id);
    setForm((f) => ({ ...f, supplier_id: id, whatsapp: Boolean(s?.has_whatsapp), email: Boolean(s?.has_email), amount_due_currency: s?.default_currency || f.amount_due_currency }));
  }

  async function run(action: () => Promise<{ delivery?: Delivery[]; requests: SupplierRequest[] }>, success?: string) {
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await action();
      setData((d) => (d ? { ...d, requests: result.requests } : d));
      setNotice(result.delivery ? deliverySummary(result.delivery) : success || "Saved.");
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  function send(event: React.FormEvent) {
    event.preventDefault();
    if (!form.supplier_id) { setError("Choose a supplier."); return; }
    const amount = form.amount_due.trim() === "" ? null : Number(form.amount_due);
    if (amount !== null && (!Number.isFinite(amount) || amount < 0)) { setError("Enter a valid amount for the supplier."); return; }
    const channels = [...(form.whatsapp && chosen?.has_whatsapp ? ["whatsapp"] : []), ...(form.email && chosen?.has_email ? ["email"] : [])];
    void run(async () => {
      const result = await call<{ delivery: Delivery[]; requests: SupplierRequest[] }>(`/api/admin/bookings/${bookingId}/supplier-requests`, {
        method: "POST",
        body: JSON.stringify({ supplier_id: form.supplier_id, channels, note: form.note, include_guest_price: form.include_guest_price, amount_due: amount, amount_due_currency: amount === null ? null : form.amount_due_currency }),
      });
      setForm((f) => ({ ...f, supplier_id: "", note: "", amount_due: "" }));
      return result;
    });
  }

  const act = (request: SupplierRequest, body: Record<string, unknown>, success?: string) =>
    run(() => call(`/api/admin/supplier-requests/${request.id}`, { method: "PATCH", body: JSON.stringify(body) }), success);
  const channelsFor = (request: SupplierRequest) => [...(request.supplier?.whatsapp ? ["whatsapp"] : []), ...(request.supplier?.email ? ["email"] : [])];

  if (error && !data) return <section className="rounded-2xl border-2 border-violet-200 bg-violet-50 p-5 text-sm"><b className="text-xs uppercase tracking-wider text-violet-900">Suppliers · confirmations</b><p className="mt-2 text-rose-700" role="alert">{error}</p></section>;
  if (!data) return <section className="rounded-2xl border-2 border-violet-200 bg-violet-50 p-5 text-sm" role="status">Loading supplier requests…</section>;

  return (
    <section aria-labelledby="supplier-dispatch-title" className="rounded-2xl border-2 border-violet-200 bg-violet-50 p-5">
      <b id="supplier-dispatch-title" className="text-xs uppercase tracking-wider text-violet-900">Suppliers · send booking &amp; get confirmation</b>
      <p className="mt-1 text-sm text-slate-700">Suppliers get the booking details (never the guest&apos;s email) with a link to confirm, decline or ask for a change, and later to confirm they received their payment.</p>
      {error ? <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p> : null}
      {notice ? <p className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-800" role="status">{notice}</p> : null}

      {data.requests.length ? (
        <ul className="mt-4 space-y-3">
          {data.requests.map((request) => (
            <RequestCard key={request.id} request={request} busy={busy} canEdit={data.can_edit} canPay={data.can_record_payment} bookingCurrency={bookingCurrency}
              channels={channelsFor(request)} act={act} onCopied={() => setNotice("Link copied.")} />
          ))}
        </ul>
      ) : <p className="mt-3 text-sm text-slate-600">No supplier has been sent this booking yet.</p>}

      {data.can_edit && !bookingCancelled ? (
        <form onSubmit={send} className="mt-5 space-y-3 rounded-xl border border-violet-200 bg-white p-4">
          <p className="text-sm font-bold">Send to a supplier</p>
          <label className="block text-sm font-semibold">Supplier
            <select value={form.supplier_id} disabled={busy} onChange={(e) => pickSupplier(e.target.value)} className="mt-1 w-full rounded-xl border bg-white p-2 font-normal">
              <option value="">Choose…</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{data.linked_supplier_ids.includes(s.id) ? "★ " : ""}{s.name} · {s.type || "other"}{!s.has_whatsapp && !s.has_email ? " (no contact details)" : ""}</option>)}
            </select>
          </label>
          {chosen ? (
            <>
              <fieldset className="flex flex-wrap gap-4 text-sm">
                <legend className="sr-only">Send by</legend>
                <label className={`inline-flex items-center gap-2 ${chosen.has_whatsapp ? "" : "text-slate-400"}`}><input type="checkbox" disabled={!chosen.has_whatsapp} checked={form.whatsapp && chosen.has_whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.checked })} /><MessageCircle size={16} />WhatsApp{chosen.has_whatsapp ? "" : " (no number)"}</label>
                <label className={`inline-flex items-center gap-2 ${chosen.has_email ? "" : "text-slate-400"}`}><input type="checkbox" disabled={!chosen.has_email} checked={form.email && chosen.has_email} onChange={(e) => setForm({ ...form, email: e.target.checked })} /><Mail size={16} />Email{chosen.has_email ? "" : " (no address)"}</label>
              </fieldset>
              <div className="grid gap-2 sm:grid-cols-[1fr_6rem]">
                <label className="text-sm font-semibold">Supplier gets paid (optional)<input type="number" min="0" step="0.01" inputMode="decimal" value={form.amount_due} onChange={(e) => setForm({ ...form, amount_due: e.target.value })} className="mt-1 w-full rounded-xl border p-2 font-normal" /></label>
                <label className="text-sm font-semibold">Currency<input value={form.amount_due_currency} maxLength={3} onChange={(e) => setForm({ ...form, amount_due_currency: e.target.value.toUpperCase() })} className="mt-1 w-full rounded-xl border p-2 font-normal uppercase" /></label>
              </div>
              <label className="block text-sm font-semibold">Note to supplier (optional)<textarea value={form.note} maxLength={1000} rows={2} onChange={(e) => setForm({ ...form, note: e.target.value })} className="mt-1 w-full rounded-xl border p-2 font-normal" /></label>
              <label className="inline-flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={form.include_guest_price} onChange={(e) => setForm({ ...form, include_guest_price: e.target.checked })} /><span>Share the guest&apos;s price / amount to collect <span className="text-slate-500">(only if the supplier collects cash)</span></span></label>
            </>
          ) : null}
          <button disabled={busy || !form.supplier_id} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 p-2.5 font-bold text-white disabled:opacity-50"><Send size={16} />{form.whatsapp || form.email ? "Send request" : "Create request"}</button>
        </form>
      ) : null}
    </section>
  );
}

function RequestCard({ request, busy, canEdit, canPay, bookingCurrency, channels, act, onCopied }: {
  request: SupplierRequest; busy: boolean; canEdit: boolean; canPay: boolean; bookingCurrency: string; channels: string[];
  act: (request: SupplierRequest, body: Record<string, unknown>, success?: string) => Promise<void>; onCopied: () => void;
}) {
  const [paying, setPaying] = useState(false);
  const [payment, setPayment] = useState({ amount: request.amount_due == null ? "" : String(request.amount_due), currency: request.amount_due_currency || bookingCurrency || "USD", method: "", reference: "", note: "", notify: true });
  const closed = request.status === "cancelled" || request.status === "declined";
  const waiting = request.status === "sent" ? hoursSince(request.last_sent_at) : 0;
  const lastFailure = [...request.events].reverse().find((e) => e.event_type === "delivery_failed");

  function recordPayment(event: React.FormEvent) {
    event.preventDefault();
    const amount = Number(payment.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    void act(request, { action: "payment_sent", amount, currency: payment.currency, method: payment.method || null, reference: payment.reference, note: payment.note, channels: payment.notify ? channels : [] }).then(() => setPaying(false));
  }
  function withNote(action: string, question: string, required = false) {
    const note = prompt(question);
    if (note === null) return;
    if (required && note.trim().length < 3) return;
    void act(request, { action, note: note.trim(), ...(action === "cancel" ? { channels } : {}) });
  }

  return (
    <li className="rounded-xl bg-white p-3 text-sm shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <b>{request.supplier?.name || "Supplier"}</b>
        <div className="flex flex-wrap gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusTone[request.status]}`}>{statusLabels[request.status]}{waiting >= 3 ? ` · ${waiting}h` : ""}</span>
          {request.payment_status !== "none" ? <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${paymentTone[request.payment_status]}`}>{paymentLabels[request.payment_status]}</span> : null}
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Sent {stamp(request.sent_at)}{request.last_sent_at !== request.sent_at ? ` · resent ${stamp(request.last_sent_at)}` : ""}
        {request.first_viewed_at ? ` · opened ${stamp(request.first_viewed_at)}` : " · not opened yet"}
        {request.responded_at ? ` · answered ${stamp(request.responded_at)}` : ""}
      </p>
      {request.amount_due != null ? <p className="mt-1 text-xs">Supplier amount: <b>{money(request.amount_due, request.amount_due_currency)}</b></p> : null}
      {request.supplier_note ? <p className={`mt-2 rounded-lg p-2 ${request.status === "declined" || request.status === "change_requested" ? "bg-amber-50 text-amber-900" : "bg-slate-50"}`}><b>Supplier:</b> {request.supplier_note}</p> : null}
      {request.payment_status !== "none" ? <p className="mt-1 text-xs">Paid {money(request.payment_amount, request.payment_currency)} {stamp(request.payment_sent_at)}{request.payment_method ? ` · ${request.payment_method.replace(/_/g, " ")}` : ""}{request.payment_reference ? ` · ref ${request.payment_reference}` : ""}{request.payment_confirmed_at ? ` · receipt confirmed ${stamp(request.payment_confirmed_at)}` : ""}</p> : null}
      {lastFailure && request.status === "sent" ? <p className="mt-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-800">Last {String(lastFailure.metadata?.channel || "message")} failed: {reasonLabels[String(lastFailure.metadata?.reason || "")] || String(lastFailure.metadata?.reason || "unknown")}. Use “Open in WhatsApp” to send it yourself.</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {request.manual_whatsapp_url && request.status !== "cancelled" ? <a href={request.manual_whatsapp_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2.5 py-1.5 text-xs font-bold text-emerald-800"><MessageCircle size={14} />Open in WhatsApp</a> : null}
        {request.status !== "cancelled" ? <button type="button" onClick={() => { void navigator.clipboard.writeText(request.link).then(onCopied); }} className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold"><Copy size={14} />Copy link</button> : null}
        {canEdit && !closed ? <>
          {request.status === "sent" && channels.length ? <button type="button" disabled={busy} onClick={() => act(request, { action: "resend", kind: "reminder", channels })} className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold"><RefreshCw size={14} />Send reminder</button> : null}
          <button type="button" disabled={busy} onClick={() => { if (confirm("Send the latest booking details and ask the supplier to confirm again?")) void act(request, { action: "resend", kind: "update", refresh_details: true, channels }); }} className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold"><Send size={14} />Send updated details</button>
          {request.status !== "confirmed" ? <button type="button" disabled={busy} onClick={() => withNote("mark_confirmed", "Record that the supplier confirmed (e.g. by phone). Note (optional):")} className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold text-emerald-800"><CheckCircle2 size={14} />Mark confirmed</button> : null}
          <button type="button" disabled={busy} onClick={() => withNote("mark_declined", "Record that the supplier declined. Reason (optional):")} className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold text-rose-800"><XCircle size={14} />Mark declined</button>
        </> : null}
        {canEdit && request.status !== "cancelled" ? <button type="button" disabled={busy} onClick={() => withNote("cancel", `Cancel this request${channels.length ? " and tell the supplier the booking is off" : ""}? Note (optional):`)} className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold text-slate-600">Cancel request</button> : null}
        {canPay && request.status !== "cancelled" && request.payment_status !== "received" ? <button type="button" disabled={busy} onClick={() => setPaying((v) => !v)} className="inline-flex items-center gap-1 rounded-lg border border-violet-300 px-2.5 py-1.5 text-xs font-bold text-violet-800"><Wallet size={14} />{request.payment_status === "none" ? "Record payment" : "Update payment"}</button> : null}
      </div>

      {paying ? (
        <form onSubmit={recordPayment} className="mt-3 grid gap-2 rounded-lg border border-violet-200 bg-violet-50 p-3 sm:grid-cols-2">
          <label className="text-xs font-semibold">Amount paid<input required type="number" min="0.01" step="0.01" inputMode="decimal" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} className="mt-1 w-full rounded-lg border bg-white p-2 font-normal" /></label>
          <label className="text-xs font-semibold">Currency<input required maxLength={3} value={payment.currency} onChange={(e) => setPayment({ ...payment, currency: e.target.value.toUpperCase() })} className="mt-1 w-full rounded-lg border bg-white p-2 font-normal uppercase" /></label>
          <label className="text-xs font-semibold">Method<select value={payment.method} onChange={(e) => setPayment({ ...payment, method: e.target.value })} className="mt-1 w-full rounded-lg border bg-white p-2 font-normal"><option value="">—</option>{paymentMethods.map((m) => <option key={m} value={m}>{m.replace(/_/g, " ")}</option>)}</select></label>
          <label className="text-xs font-semibold">Reference<input maxLength={200} value={payment.reference} onChange={(e) => setPayment({ ...payment, reference: e.target.value })} className="mt-1 w-full rounded-lg border bg-white p-2 font-normal" /></label>
          <label className="text-xs font-semibold sm:col-span-2">Note<input maxLength={1000} value={payment.note} onChange={(e) => setPayment({ ...payment, note: e.target.value })} className="mt-1 w-full rounded-lg border bg-white p-2 font-normal" /></label>
          {channels.length ? <label className="inline-flex items-center gap-2 text-xs sm:col-span-2"><input type="checkbox" checked={payment.notify} onChange={(e) => setPayment({ ...payment, notify: e.target.checked })} />Ask the supplier to confirm they received it</label> : null}
          <p className="text-xs text-slate-600 sm:col-span-2">This records the payment for the supplier to acknowledge. Post it in Finance → Suppliers too so the ledger matches.</p>
          <button disabled={busy} className="rounded-lg bg-violet-700 p-2 text-sm font-bold text-white sm:col-span-2">Save payment</button>
        </form>
      ) : null}

      {request.events.length ? (
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer font-semibold text-slate-600">Timeline ({request.events.length})</summary>
          <ol className="mt-2 space-y-1 border-l-2 border-slate-200 pl-3">
            {request.events.map((e) => (
              <li key={e.id}><span className="text-slate-500">{stamp(e.created_at)}</span> · <b>{eventLabels[e.event_type] || e.event_type}</b>{e.event_type === "delivery_failed" ? ` (${String(e.metadata?.channel || "")})` : ""} · {e.actor}{e.note ? ` — ${e.note}` : ""}</li>
            ))}
          </ol>
        </details>
      ) : null}
    </li>
  );
}
