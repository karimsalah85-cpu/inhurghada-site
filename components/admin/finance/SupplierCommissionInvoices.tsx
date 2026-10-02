"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { commissionInvoiceSchema, commissionPeriod, commissionTotals, type CommissionInvoice, type SavedCommissionInvoice } from "@/lib/finance/commission-invoice";
import { FINANCE_CURRENCIES, formatMoney } from "@/lib/finance/money";

const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
const buttonClass = "rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-50";
const blank = (partner: string): CommissionInvoice => ({ partner, city: "", period: new Date().toISOString().slice(0, 7), currency: "USD", notes: "", rows: [{ date: new Date().toISOString().slice(0, 10), trip: "", customers: 1, ticketPrice: "0.00", commissionPercent: "25" }] });

export default function SupplierCommissionInvoices({ supplierId, partner, email, canManage }: { supplierId: string; partner: string; email?: string | null; canManage: boolean }) {
  const [invoices, setInvoices] = useState<SavedCommissionInvoice[]>([]);
  const [document, setDocument] = useState<CommissionInvoice>(() => blank(partner));
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [sendId, setSendId] = useState<string | null>(null);
  const [recipient, setRecipient] = useState(email || "");
  const createId = useRef<string | null>(null);
  const base = `/api/admin/finance/suppliers/${supplierId}/invoices`;
  const load = useCallback(async () => {
    const response = await fetch(base, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Could not load invoices.");
    setInvoices(payload.invoices);
  }, [base]);
  useEffect(() => { const timer = window.setTimeout(() => { void load().catch(reason => setError(reason.message)); }, 0); return () => window.clearTimeout(timer); }, [load]);
  const parsed = commissionInvoiceSchema.safeParse(document);
  const totals = parsed.success ? commissionTotals(parsed.data) : null;
  const change = (patch: Partial<CommissionInvoice>) => { createId.current = null; setDocument(current => ({ ...current, ...patch })); };
  // Ticket prices are finance-editable on linked rows; changing one keeps the finance link.
  const setTicketPrice = (index: number, ticketPrice: string) => { createId.current = null; setDocument(current => ({ ...current, rows: current.rows.map((row, i) => i === index ? { ...row, ticketPrice } : row) })); };
  const start = (value: CommissionInvoice) => { setDocument(structuredClone(value)); createId.current = null; setEditing(true); setError(""); setNotice(""); };
  async function loadFinance() {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`${base}/monthly?${new URLSearchParams({ period: document.period, currency: document.currency })}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load finance.");
      setDocument({ ...payload.document, notes: document.notes }); createId.current = null;
      setNotice("Loaded current unpaid commission. Review the trip amounts before saving.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load finance."); }
    finally { setBusy(false); }
  }
  async function refresh(invoice: SavedCommissionInvoice) {
    setBusy(true); setError(""); setNotice(""); setSendId(null);
    try {
      const response = await fetch(`${base}/${invoice.id}`, { method: "PATCH" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not refresh draft.");
      await load(); setNotice("Draft refreshed from finance. Review the updated PDF before sending.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not refresh draft."); }
    finally { setBusy(false); }
  }
  async function save() {
    if (!document.source) { setError("Load this month from finance first."); return; }
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setBusy(true); setError(""); setNotice("");
    createId.current ??= crypto.randomUUID();
    try {
      const response = await fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: createId.current, document: parsed.data }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save invoice.");
      setEditing(false); setNotice(`${payload.invoice.reference} saved. Preview the email and PDF before sending.`); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save invoice."); }
    finally { setBusy(false); }
  }
  async function send() {
    setBusy(true); setError(""); setNotice("");
    try {
      const source = invoices.find(invoice => invoice.id === sendId)?.document.source;
      const response = await fetch(`${base}/${sendId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipient, confirm: true, fingerprint: source?.fingerprint, generatedAt: source?.generatedAt }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Email was not confirmed.");
      setNotice(`Statement and PDF sent to ${payload.recipient}.`); setSendId(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Email was not confirmed."); }
    finally { await load().catch(() => {}); setBusy(false); }
  }
  return <section className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-black text-slate-950">Commission invoices</h2><p className="mt-1 text-sm text-slate-500">Load unpaid commission from this supplier’s bookings for any month. The supplier pays Daily Red Sea. Saving a statement does not charge them again; record commission received separately when they pay.</p></div>{canManage && <button type="button" className={buttonClass} onClick={() => start(blank(partner))}>Create invoice</button>}</div>
    {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}{notice && <p role="status" className="mt-3 text-sm text-emerald-700">{notice}</p>}
    {editing && <form className="mt-5 space-y-4 rounded-2xl bg-slate-50 p-4" onSubmit={event => { event.preventDefault(); void save(); }}>
      <fieldset disabled={busy} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">Trip month<input required type="month" className={inputClass} value={document.period} onChange={e => change({ period: e.target.value, source: undefined })} /></label>
        <label className="text-sm font-semibold">Statement currency<select className={inputClass} value={document.currency} onChange={e => change({ currency: e.target.value as CommissionInvoice["currency"], source: undefined })}>{FINANCE_CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></label>
      </div>
      <p className="text-sm text-slate-600">USD combines booking currencies using their locked trip rates. Other currencies include only bookings in that currency. Commission amounts are outstanding now for trips in the selected month, including partial payments. Ticket prices start from what customers paid; edit them to the agreed price. They change sales only, not commission.</p>
      <button type="button" className={buttonClass} onClick={() => void loadFinance()}>{busy ? "Loading…" : "Load from finance"}</button>
      {document.source && <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Booking / trip</th><th className="p-2">Date</th><th className="p-2 text-right">Customers</th><th className="p-2 text-right">Ticket price ({document.currency})</th><th className="p-2 text-right">Total sales</th><th className="p-2 text-right">Commission owed to Daily Red Sea</th></tr></thead><tbody>{document.rows.map((row, index) => <tr key={row.lineId} className="border-t border-slate-200"><td className="p-2">{row.bookingReference}<br />{row.trip}</td><td className="p-2">{row.date}</td><td className="p-2 text-right">{row.customers}</td><td className="p-2 text-right"><input aria-label={`Ticket price for ${row.bookingReference}`} inputMode="decimal" className={`${inputClass} w-28 text-right`} value={row.ticketPrice} onChange={e => setTicketPrice(index, e.target.value)} /></td><td className="p-2 text-right">{totals?.rows[index] ? formatMoney(totals.rows[index].sales, document.currency) : "—"}</td><td className="p-2 text-right">{formatMoney(row.commissionAmount!, document.currency)} {document.currency}{row.nativeCurrency !== document.currency && <span className="block text-xs text-slate-500">{row.nativeCommission} {row.nativeCurrency} × {row.exchangeRate}</span>}</td></tr>)}</tbody></table></div>}
      <label className="block text-sm font-semibold">Notes / payment instructions<textarea maxLength={1000} className={inputClass} rows={3} value={document.notes} onChange={e => change({ notes: e.target.value })} /></label>
      {document.source && totals && <p className="font-bold text-slate-900">{totals.customers} customers · Sales {formatMoney(totals.sales, document.currency)} · Commission {formatMoney(totals.commission, document.currency)} {document.currency}</p>}
      <div className="flex gap-3"><button className={`${buttonClass} bg-slate-900 text-white`} disabled={!document.source} type="submit">{busy ? "Saving…" : "Save & preview"}</button><button type="button" className={buttonClass} onClick={() => setEditing(false)}>Cancel</button></div>
      </fieldset>
    </form>}
    <div className="mt-4 space-y-3">{invoices.length === 0 && !error && <p className="text-sm text-slate-500">No saved commission invoices.</p>}{invoices.map(invoice => <div key={invoice.id} className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold">{invoice.reference} · {commissionPeriod(invoice.document.period)}</p><p className="text-sm text-slate-600">{invoice.document.partner} · {formatMoney(commissionTotals(invoice.document).commission, invoice.document.currency)} {invoice.document.currency} · {invoice.status.replaceAll("_", " ")}</p>{invoice.recipient && <p className="text-xs text-slate-500">{invoice.recipient}{invoice.sent_at ? ` · ${new Date(invoice.sent_at).toLocaleString()}` : ""}</p>}</div>
      <div className="flex flex-wrap gap-2"><a className={buttonClass} target="_blank" rel="noreferrer" href={`${base}/${invoice.id}?format=email`}>Preview email</a><a className={buttonClass} target="_blank" rel="noreferrer" href={`${base}/${invoice.id}`}>PDF</a>{canManage && <><button type="button" className={buttonClass} onClick={() => start({ ...blank(partner), currency: invoice.document.currency })}>New month</button>{invoice.status === "draft" && <><button type="button" disabled={busy} className={buttonClass} onClick={() => void refresh(invoice)}>Refresh from finance</button><button type="button" disabled={busy || !invoice.document.source} className={buttonClass} onClick={() => { setSendId(invoice.id); setRecipient(email || ""); }}>Send email</button></>}</>}</div></div>
      {!invoice.document.source && invoice.status === "draft" && <p className="mt-2 text-sm text-amber-800">This older draft is not linked to finance. Refresh it before sending; its amounts will come from bookings and its old notes will be cleared.</p>}
      {(invoice.status === "delivery_unknown" || invoice.status === "sending") && <p className="mt-2 text-sm text-amber-800">Check the sent mailbox before creating a replacement. Sending again is disabled to prevent duplicate emails.</p>}
      {sendId === invoice.id && invoice.status === "draft" && <form className="mt-3 flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); void send(); }}><label className="text-sm font-semibold">Recipient email<input required type="email" disabled={busy} className={inputClass} value={recipient} onChange={e => setRecipient(e.target.value)} /></label><button disabled={busy} className={`${buttonClass} bg-slate-900 text-white`}>{busy ? "Sending…" : "Confirm & send PDF"}</button><button type="button" disabled={busy} className={buttonClass} onClick={() => setSendId(null)}>Cancel</button></form>}
    </div>)}</div>
  </section>;
}
