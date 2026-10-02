"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { commissionInvoiceSchema, commissionPeriod, commissionTotals, septemberHaddadInvoice, type CommissionInvoice, type SavedCommissionInvoice } from "@/lib/finance/commission-invoice";
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
  const changeRow = (index: number, patch: Partial<CommissionInvoice["rows"][number]>) => change({ rows: document.rows.map((row, i) => i === index ? { ...row, ...patch } : row) });
  const start = (value: CommissionInvoice) => { setDocument(structuredClone(value)); createId.current = null; setEditing(true); setError(""); setNotice(""); };
  async function save() {
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
      const response = await fetch(`${base}/${sendId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipient, confirm: true }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Email was not confirmed.");
      setNotice(`Statement and PDF sent to ${payload.recipient}.`); setSendId(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Email was not confirmed."); }
    finally { await load().catch(() => {}); setBusy(false); }
  }
  return <section className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-black text-slate-950">Commission invoices</h2><p className="mt-1 text-sm text-slate-500">Create a trip-by-trip commission statement, download its PDF, and email it to your supplier. Statements do not change ledger balances.</p></div>{canManage && <button type="button" className={buttonClass} onClick={() => start(blank(partner))}>Create invoice</button>}</div>
    {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}{notice && <p role="status" className="mt-3 text-sm text-emerald-700">{notice}</p>}
    {editing && <form className="mt-5 space-y-4 rounded-2xl bg-slate-50 p-4" onSubmit={event => { event.preventDefault(); void save(); }}>
      <fieldset disabled={busy} className="space-y-4">
      {/haddad/i.test(partner) && <button type="button" className={buttonClass} onClick={() => start(septemberHaddadInvoice)}>Load September 2026 statement</button>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-semibold">Partner<input required maxLength={100} className={inputClass} value={document.partner} onChange={e => change({ partner: e.target.value })} /></label>
        <label className="text-sm font-semibold">City<input required maxLength={60} className={inputClass} value={document.city} onChange={e => change({ city: e.target.value })} /></label>
        <label className="text-sm font-semibold">Period<input required type="month" className={inputClass} value={document.period} onChange={e => change({ period: e.target.value })} /></label>
        <label className="text-sm font-semibold">Currency<select className={inputClass} value={document.currency} onChange={e => change({ currency: e.target.value as CommissionInvoice["currency"] })}>{FINANCE_CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></label>
      </div>
      {document.rows.map((row, index) => <div key={index} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-6">
        <label className="text-xs font-semibold">Date<input required type="date" className={inputClass} value={row.date} onChange={e => changeRow(index, { date: e.target.value })} /></label>
        <label className="text-xs font-semibold lg:col-span-2">Trip<input required maxLength={140} className={inputClass} value={row.trip} onChange={e => changeRow(index, { trip: e.target.value })} /></label>
        <label className="text-xs font-semibold">Customers<input required type="number" min="1" max="10000" step="1" className={inputClass} value={row.customers || ""} onChange={e => changeRow(index, { customers: Number(e.target.value) })} /></label>
        <label className="text-xs font-semibold">Ticket price ({document.currency})<input required type="number" min="0" max="1000000" step="0.01" className={inputClass} value={row.ticketPrice} onChange={e => changeRow(index, { ticketPrice: e.target.value })} /></label>
        <label className="text-xs font-semibold">Commission %<input required type="number" min="0" max="100" step="0.01" className={inputClass} value={row.commissionPercent} onChange={e => changeRow(index, { commissionPercent: e.target.value })} /></label>
        <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2 lg:col-span-6"><span className="text-sm text-slate-600">{totals ? `Sales ${formatMoney(totals.rows[index].sales, document.currency)} · Commission ${formatMoney(totals.rows[index].commission, document.currency)}` : "Complete the fields to calculate totals."}</span><button type="button" disabled={document.rows.length === 1} className="text-sm text-rose-700 disabled:opacity-40" onClick={() => change({ rows: document.rows.filter((_, i) => i !== index) })}>Remove row {index + 1}</button></div>
      </div>)}
      <button type="button" disabled={document.rows.length >= 100} className={buttonClass} onClick={() => change({ rows: [...document.rows, { date: `${document.period}-01`, trip: "", customers: 1, ticketPrice: "0.00", commissionPercent: "25" }] })}>Add trip</button>
      <label className="block text-sm font-semibold">Notes / payment instructions<textarea maxLength={1000} className={inputClass} rows={3} value={document.notes} onChange={e => change({ notes: e.target.value })} /></label>
      {totals && <p className="font-bold text-slate-900">{totals.customers} customers · Sales {formatMoney(totals.sales, document.currency)} · Commission {formatMoney(totals.commission, document.currency)} {document.currency}</p>}
      <div className="flex gap-3"><button className={`${buttonClass} bg-slate-900 text-white`} type="submit">{busy ? "Saving…" : "Save & preview"}</button><button type="button" className={buttonClass} onClick={() => setEditing(false)}>Cancel</button></div>
      </fieldset>
    </form>}
    <div className="mt-4 space-y-3">{invoices.length === 0 && !error && <p className="text-sm text-slate-500">No saved commission invoices.</p>}{invoices.map(invoice => <div key={invoice.id} className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold">{invoice.reference} · {commissionPeriod(invoice.document.period)}</p><p className="text-sm text-slate-600">{invoice.document.partner} · {formatMoney(commissionTotals(invoice.document).commission, invoice.document.currency)} {invoice.document.currency} · {invoice.status.replaceAll("_", " ")}</p>{invoice.recipient && <p className="text-xs text-slate-500">{invoice.recipient}{invoice.sent_at ? ` · ${new Date(invoice.sent_at).toLocaleString()}` : ""}</p>}</div>
      <div className="flex flex-wrap gap-2"><a className={buttonClass} target="_blank" rel="noreferrer" href={`${base}/${invoice.id}?format=email`}>Preview email</a><a className={buttonClass} target="_blank" rel="noreferrer" href={`${base}/${invoice.id}`}>PDF</a>{canManage && <><button type="button" className={buttonClass} onClick={() => start(invoice.document)}>Copy to new draft</button>{invoice.status === "draft" && <button type="button" disabled={busy} className={buttonClass} onClick={() => { setSendId(invoice.id); setRecipient(email || ""); }}>Send email</button>}</>}</div></div>
      {(invoice.status === "delivery_unknown" || invoice.status === "sending") && <p className="mt-2 text-sm text-amber-800">Check the sent mailbox before creating a replacement. Sending again is disabled to prevent duplicate emails.</p>}
      {sendId === invoice.id && invoice.status === "draft" && <form className="mt-3 flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); void send(); }}><label className="text-sm font-semibold">Recipient email<input required type="email" disabled={busy} className={inputClass} value={recipient} onChange={e => setRecipient(e.target.value)} /></label><button disabled={busy} className={`${buttonClass} bg-slate-900 text-white`}>{busy ? "Sending…" : "Confirm & send PDF"}</button><button type="button" disabled={busy} className={buttonClass} onClick={() => setSendId(null)}>Cancel</button></form>}
    </div>)}</div>
  </section>;
}
