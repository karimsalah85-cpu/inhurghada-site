"use client";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { FINANCE_CURRENCIES, formatMoney, fromMinor, toMinor, type FinanceCurrency } from "@/lib/finance/money";
import { entryTypeLabels, filterLedger, LEDGER_ENTRY_TYPES, type BalanceLabel, type LedgerFilters, type LedgerRow } from "@/lib/finance/supplier-ledger";
import type { SupplierBookingRow } from "@/lib/finance/supplier-data";
import { FinanceNotConfigured, toneClasses } from "@/components/admin/finance/FinanceSuppliers";

type Detail = {
  configured: boolean;
  error?: string;
  canManage: boolean;
  supplier: { id: string; name: string; type: string; contact_name: string | null; phone: string | null; default_currency: string };
  ledger: LedgerRow[];
  lines: SupplierBookingRow[];
  openLineIds: string[];
  balances: { currency: FinanceCurrency; balance: string }[];
  usd_balance: string;
  missing_rates: FinanceCurrency[];
  label: BalanceLabel;
};

type EntryForm = "payment_to_supplier" | "commission_received_from_supplier" | "adjustment";
const today = () => new Date().toISOString().slice(0, 10);
const statusText: Record<string, string> = {
  not_collected: "Not collected", partial: "Partly collected", collected: "Collected",
  unpaid: "Unpaid", paid: "Paid", not_applicable: "—",
  daily_red_sea: "Daily Red Sea", supplier: "Supplier",
  none: "No entry", awaiting_fx: "Awaiting FX rate", usd_pending: "USD pending", posted: "Posted",
};
const statusTone = (value: string | null) =>
  value === "paid" || value === "collected" ? "text-emerald-700" : value === "partial" || value === "awaiting_fx" || value === "usd_pending" ? "text-amber-700" : value === "unpaid" || value === "not_collected" ? "text-rose-700" : "text-slate-500";

async function send(url: string, method: string, body: unknown) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "The update failed.");
  return payload;
}

export default function FinanceSupplierDetail({ supplierId }: { supplierId: string }) {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<EntryForm | null>(null);
  const [filters, setFilters] = useState<LedgerFilters>({ type: "all", status: "all" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingLine, setEditingLine] = useState<string | null>(null);
  const [reversing, setReversing] = useState<string | null>(null);
  const [confirmSettlement, setConfirmSettlement] = useState(false);
  const settlementKey = useRef<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/admin/finance/suppliers/${supplierId}`, { cache: "no-store" });
    const payload = await response.json() as Detail;
    if (!response.ok && payload.configured !== false) throw new Error(payload.error || "Could not load the supplier.");
    setData(payload);
  }, [supplierId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void load().catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load the supplier.")); }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  async function run(action: () => Promise<string>) {
    setBusy(true); setError(""); setNotice("");
    try { setNotice(await action()); await load(); return true; }
    catch (reason) { setError(reason instanceof Error ? reason.message : "The update failed."); return false; }
    finally { setBusy(false); }
  }

  const openLines = useMemo(() => new Set(data?.openLineIds || []), [data]);
  const ledgerRows = useMemo(() => (data ? filterLedger(data.ledger, filters, openLines).slice().reverse() : []), [data, filters, openLines]);
  const selectedNet = useMemo(() => {
    const totals = new Map<FinanceCurrency, bigint>();
    for (const line of data?.lines || []) {
      if (!selected.has(line.line_id)) continue;
      for (const balance of line.balances) totals.set(balance.currency, (totals.get(balance.currency) ?? 0n) + toMinor(balance.balance));
    }
    return totals;
  }, [data, selected]);

  if (error && !data) return <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>;
  if (!data) return <p className="text-sm text-slate-500">Loading supplier…</p>;
  if (data.configured === false) return <FinanceNotConfigured message={data.error} />;

  const statementQuery = new URLSearchParams({ ...(filters.from ? { from: filters.from } : {}), ...(filters.to ? { to: filters.to } : {}) }).toString();

  function toggleLine(lineId: string) {
    settlementKey.current = null;
    setConfirmSettlement(false);
    setSelected((current) => { const next = new Set(current); if (next.has(lineId)) next.delete(lineId); else next.add(lineId); return next; });
  }

  async function submitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const amount = form === "adjustment" && values.direction === "we_owe" ? `-${values.amount}` : values.amount;
    const ok = await run(async () => {
      await send(`/api/admin/finance/suppliers/${supplierId}/entries`, "POST", {
        entry_type: form, amount, currency: values.currency, entry_date: values.entry_date, line_id: values.line_id || null, note: values.note || undefined,
      });
      return `${entryTypeLabels[form!]} recorded.`;
    });
    if (ok) setForm(null);
  }

  async function settle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    // One key per settlement attempt: a retried submit (double click, network error) cannot post twice.
    settlementKey.current ??= crypto.randomUUID();
    const ok = await run(async () => {
      const result = await send(`/api/admin/finance/suppliers/${supplierId}/settlements`, "POST", {
        idempotency_key: settlementKey.current, line_ids: [...selected], entry_date: values.entry_date, note: values.note || undefined,
      });
      return `Settlement recorded for ${result.settlement.entries} booking balance(s).`;
    });
    if (ok) { settlementKey.current = null; setSelected(new Set()); setConfirmSettlement(false); }
  }

  async function saveCollection(event: FormEvent<HTMLFormElement>, line: SupplierBookingRow) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const ok = await run(async () => {
      await send(`/api/admin/finance/lines/${line.line_id}`, "PATCH", {
        collected_by: values.collected_by, collection_status: values.collection_status,
        collected_amount: values.collection_status === "not_collected" ? "0" : values.collected_amount || "0",
      });
      return `Collection updated for ${line.reference}.`;
    });
    if (ok) setEditingLine(null);
  }

  async function reverse(event: FormEvent<HTMLFormElement>, entry: LedgerRow) {
    event.preventDefault();
    const note = String(new FormData(event.currentTarget).get("note") || "");
    const ok = await run(async () => { await send(`/api/admin/finance/ledger/${entry.id}/reverse`, "POST", { note }); return `Entry #${entry.entry_no} reversed.`; });
    if (ok) setReversing(null);
  }

  const bookingOptions = data.lines.filter((line) => line.current_supplier || line.balances.length);
  const input = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-normal";

  return <div className="space-y-6">
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/finance/suppliers" className="text-sm font-semibold text-cyan-700 hover:underline">← All suppliers</Link>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{data.supplier.name}</h2>
          <p className="text-sm capitalize text-slate-500">{data.supplier.type}{data.supplier.contact_name ? ` · ${data.supplier.contact_name}` : ""}{data.supplier.phone ? ` · ${data.supplier.phone}` : ""}</p>
        </div>
        <div className="text-right">
          <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-black ring-1 ${toneClasses[data.label.tone]}`}>{data.label.text}</span>
          <div className="mt-2 text-sm tabular-nums text-slate-600">{data.balances.map((balance) => <div key={balance.currency}>{formatMoney(balance.balance, balance.currency)}</div>)}</div>
          {data.missing_rates.length ? <p className="text-xs text-amber-700">No current rate for {data.missing_rates.join(", ")}</p> : null}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        {data.canManage ? <>
          <button type="button" onClick={() => setForm("payment_to_supplier")} className="rounded-xl bg-slate-950 px-4 py-2 font-bold text-white">Record payment to supplier</button>
          <button type="button" onClick={() => setForm("commission_received_from_supplier")} className="rounded-xl bg-slate-950 px-4 py-2 font-bold text-white">Record commission received</button>
          <button type="button" onClick={() => setForm("adjustment")} className="rounded-xl border border-slate-300 px-4 py-2 font-bold text-slate-800">Add adjustment</button>
        </> : <p className="text-slate-500">View only: your role cannot record finance entries.</p>}
        <span className="grow" />
        <a href={`/api/admin/finance/suppliers/${supplierId}/statement?format=csv&${statementQuery}`} className="rounded-xl border border-slate-300 px-4 py-2 font-bold text-slate-800">Statement CSV</a>
        <a href={`/api/admin/finance/suppliers/${supplierId}/statement?format=pdf&${statementQuery}`} className="rounded-xl border border-slate-300 px-4 py-2 font-bold text-slate-800">Statement PDF</a>
      </div>
      {error ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {notice ? <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p> : null}

      {form ? <form onSubmit={submitEntry} className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-3">
        <h3 className="font-black sm:col-span-3">{entryTypeLabels[form]}</h3>
        {form === "adjustment" ? <label className="font-semibold">Direction<select name="direction" className={input}><option value="owes_us">Supplier owes us more (+)</option><option value="we_owe">We owe the supplier more (−)</option></select></label> : null}
        <label className="font-semibold">Amount<input name="amount" required inputMode="decimal" pattern="\d+(\.\d{1,2})?" placeholder="0.00" className={input} /></label>
        <label className="font-semibold">Currency<select name="currency" defaultValue={data.supplier.default_currency} className={input}>{FINANCE_CURRENCIES.map((code) => <option key={code}>{code}</option>)}</select></label>
        <label className="font-semibold">Date<input name="entry_date" type="date" required defaultValue={today()} className={input} /></label>
        <label className="font-semibold sm:col-span-2">Booking (optional — for partial or full payment of one booking)<select name="line_id" className={input}><option value="">Not linked to a booking</option>{bookingOptions.map((line) => <option key={line.line_id} value={line.line_id}>{line.reference}{line.line_no > 1 ? `/${line.line_no}` : ""} · {line.trip_date || "no date"} · {line.tour_name || "Trip"}</option>)}</select></label>
        <label className="font-semibold sm:col-span-3">Note{form === "adjustment" ? " (required)" : ""}<input name="note" required={form === "adjustment"} minLength={form === "adjustment" ? 3 : undefined} maxLength={1000} className={input} /></label>
        <div className="flex gap-2 sm:col-span-3"><button disabled={busy} className="rounded-xl bg-cyan-700 px-4 py-2 font-bold text-white disabled:opacity-50">Save entry</button><button type="button" onClick={() => setForm(null)} className="rounded-xl border border-slate-300 px-4 py-2 font-bold">Cancel</button></div>
      </form> : null}
    </section>

    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl font-black">Bookings</h2><p className="text-sm text-slate-500">One row per trip. Tick bookings with an open balance to settle them together.</p></div>
        {selected.size && data.canManage ? <div className="rounded-2xl bg-cyan-50 p-3 text-sm text-cyan-950">
          <p className="font-bold">{selected.size} selected · Net {[...selectedNet].map(([currency, minor]) => `${minor > 0n ? "supplier pays us" : minor < 0n ? "we pay supplier" : "zero"} ${formatMoney(minor < 0n ? -minor : minor, currency)}`).join(" · ") || "—"}</p>
          {confirmSettlement ? <form onSubmit={settle} className="mt-2 flex flex-wrap items-end gap-2">
            <label className="text-xs font-semibold">Date<input name="entry_date" type="date" required defaultValue={today()} className="mt-1 block rounded-lg border border-cyan-200 px-2 py-1" /></label>
            <label className="text-xs font-semibold">Note<input name="note" maxLength={1000} className="mt-1 block rounded-lg border border-cyan-200 px-2 py-1" /></label>
            <button disabled={busy} className="rounded-lg bg-cyan-700 px-3 py-1.5 font-bold text-white disabled:opacity-50">Confirm settlement</button>
            <button type="button" onClick={() => setConfirmSettlement(false)} className="rounded-lg border border-cyan-300 px-3 py-1.5 font-bold">Cancel</button>
          </form> : <button type="button" onClick={() => setConfirmSettlement(true)} className="mt-2 rounded-lg bg-cyan-700 px-3 py-1.5 font-bold text-white">Settle selected…</button>}
        </div> : null}
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500"><tr>
            <th className="py-2 pr-2" /><th className="py-2 pr-3">Trip date</th><th className="py-2 pr-3">Booking / tour</th><th className="py-2 pr-3 text-right">Guests</th>
            <th className="py-2 pr-3">Collected by</th><th className="py-2 pr-3">Collection</th><th className="py-2 pr-3">Supplier cost</th><th className="py-2 pr-3">Commission</th>
            <th className="py-2 pr-3 text-right">Margin (USD)</th><th className="py-2 pr-3 text-right">Balance with supplier</th><th className="py-2" />
          </tr></thead>
          <tbody>
            {data.lines.map((line) => <Fragment key={line.line_id}>
              <tr className={`border-t border-slate-100 align-top ${line.included ? "" : "text-slate-400"}`}>
                <td className="py-3 pr-2"><input type="checkbox" aria-label={`Select ${line.reference}`} disabled={!line.balances.length || !data.canManage} checked={selected.has(line.line_id)} onChange={() => toggleLine(line.line_id)} /></td>
                <td className="py-3 pr-3 tabular-nums">{line.trip_date || "—"}</td>
                <td className="py-3 pr-3"><span className="font-bold text-slate-900">{line.reference}{line.line_no > 1 ? `/${line.line_no}` : ""}</span><p className="text-xs text-slate-500">{line.tour_name || "Trip"} · {line.outcome}{line.current_supplier ? "" : " · former supplier"}</p></td>
                <td className="py-3 pr-3 text-right">{line.guests}</td>
                <td className="py-3 pr-3">{statusText[line.collected_by]}</td>
                <td className={`py-3 pr-3 ${statusTone(line.collection_status)}`}>{statusText[line.collection_status]}{line.collection_status === "partial" ? ` · ${formatMoney(line.collected_amount, line.currency)}` : ""}</td>
                <td className={`py-3 pr-3 ${statusTone(line.supplier_cost_paid_status)}`}>{line.current_supplier ? statusText[line.supplier_cost_paid_status || ""] || "—" : "—"}</td>
                <td className={`py-3 pr-3 ${statusTone(line.commission_received_status)}`}>{line.current_supplier ? statusText[line.commission_received_status || ""] || "—" : "—"}{line.ledger_state === "awaiting_fx" || line.ledger_state === "usd_pending" ? <p className="text-xs text-amber-700">{statusText[line.ledger_state]}</p> : null}</td>
                <td className={`py-3 pr-3 text-right tabular-nums ${line.margin_amount_usd !== null && Number(line.margin_amount_usd) < 0 ? "font-bold text-rose-700" : ""}`}>{line.margin_amount_usd === null ? <span className="text-xs text-amber-700">USD pending</span> : <>{formatMoney(line.margin_amount_usd)}<p className="text-xs text-slate-500">{line.margin_pct_usd === null ? "—" : `${line.margin_pct_usd}%`}</p></>}</td>
                <td className="py-3 pr-3 text-right tabular-nums">{line.balances.length ? line.balances.map((balance) => <div key={balance.currency} className={Number(balance.balance) < 0 ? "text-amber-800" : "text-emerald-800"}>{formatMoney(balance.balance, balance.currency)}</div>) : <span className="text-slate-400">Settled</span>}</td>
                <td className="py-3 text-right">{data.canManage && line.current_supplier ? <button type="button" onClick={() => setEditingLine(editingLine === line.line_id ? null : line.line_id)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-bold">Collection…</button> : null}</td>
              </tr>
              {editingLine === line.line_id ? <tr className="bg-slate-50"><td colSpan={11} className="p-3">
                <form onSubmit={(event) => saveCollection(event, line)} className="flex flex-wrap items-end gap-3 text-sm">
                  <label className="font-semibold">Guest paid<select name="collected_by" defaultValue={line.collected_by} className="mt-1 block rounded-lg border border-slate-200 bg-white px-2 py-1.5"><option value="daily_red_sea">Daily Red Sea</option><option value="supplier">The supplier</option></select></label>
                  <label className="font-semibold">Status<select name="collection_status" defaultValue={line.collection_status} className="mt-1 block rounded-lg border border-slate-200 bg-white px-2 py-1.5"><option value="not_collected">Not collected</option><option value="partial">Partly collected</option><option value="collected">Collected</option></select></label>
                  <label className="font-semibold">Amount collected ({line.currency})<input name="collected_amount" inputMode="decimal" pattern="\d+(\.\d{1,2})?" defaultValue={line.collection_status === "not_collected" ? line.net_selling_price : line.collected_amount} className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5" /></label>
                  <button disabled={busy} className="rounded-lg bg-cyan-700 px-3 py-1.5 font-bold text-white disabled:opacity-50">Save</button>
                  <p className="basis-full text-xs text-slate-500">Changing who collected reverses the automatic ledger entry and posts the new one; past entries are never edited.</p>
                </form>
              </td></tr> : null}
            </Fragment>)}
            {!data.lines.length ? <tr><td colSpan={11} className="py-6 text-center text-slate-500">No bookings with this supplier yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>

    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black">Ledger</h2>
      <p className="text-sm text-slate-500">Append-only. Balance is the running balance in the entry&apos;s currency over the full history. Corrections appear as reversals.</p>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-5">
        <label className="font-semibold">From<input type="date" value={filters.from || ""} onChange={(event) => setFilters({ ...filters, from: event.target.value || undefined })} className={input} /></label>
        <label className="font-semibold">To<input type="date" value={filters.to || ""} onChange={(event) => setFilters({ ...filters, to: event.target.value || undefined })} className={input} /></label>
        <label className="font-semibold">Type<select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value as LedgerFilters["type"] })} className={input}><option value="all">All types</option>{LEDGER_ENTRY_TYPES.map((type) => <option key={type} value={type}>{entryTypeLabels[type]}</option>)}</select></label>
        <label className="font-semibold">Booking<input value={filters.booking || ""} placeholder="Reference" onChange={(event) => setFilters({ ...filters, booking: event.target.value })} className={input} /></label>
        <label className="font-semibold">Status<select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as LedgerFilters["status"] })} className={input}><option value="all">All</option><option value="open">Open bookings</option><option value="settled">Settled bookings</option><option value="reversed">Reversed / reversals</option></select></label>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className="py-2 pr-3">Date</th><th className="py-2 pr-3">#</th><th className="py-2 pr-3">Type</th><th className="py-2 pr-3">Booking</th><th className="py-2 pr-3">Note</th><th className="py-2 pr-3 text-right">Amount</th><th className="py-2 pr-3 text-right">Balance</th><th className="py-2 pr-3 text-right">USD</th><th className="py-2" /></tr></thead>
          <tbody>
            {ledgerRows.map((row) => <Fragment key={row.id}>
              <tr className={`border-t border-slate-100 align-top ${row.reversed || row.entry_type === "reversal" ? "text-slate-400" : ""}`}>
                <td className="py-2 pr-3 tabular-nums">{row.entry_date}</td>
                <td className="py-2 pr-3 tabular-nums">{row.entry_no}</td>
                <td className="py-2 pr-3">{entryTypeLabels[row.entry_type]}{row.is_automatic ? <span className="ml-1 rounded bg-slate-100 px-1.5 text-[10px] font-bold uppercase text-slate-500">auto</span> : null}{row.reversed ? <span className="ml-1 rounded bg-slate-100 px-1.5 text-[10px] font-bold uppercase text-slate-500">reversed</span> : null}</td>
                <td className="py-2 pr-3">{row.booking_reference || "—"}</td>
                <td className="py-2 pr-3 text-slate-600">{row.note || ""}<p className="text-xs text-slate-400">{row.created_by_email}</p></td>
                <td className={`py-2 pr-3 text-right tabular-nums ${Number(row.amount) < 0 ? "text-amber-800" : "text-emerald-800"}`}>{formatMoney(row.amount, row.currency)}</td>
                <td className="py-2 pr-3 text-right font-semibold tabular-nums">{formatMoney(row.running_balance, row.currency)}</td>
                <td className="py-2 pr-3 text-right tabular-nums text-slate-500">{row.amount_usd === null ? "pending" : formatMoney(row.amount_usd)}</td>
                <td className="py-2 text-right">{data.canManage && !row.is_automatic && !row.reversed && row.entry_type !== "reversal" ? <button type="button" onClick={() => setReversing(reversing === row.id ? null : row.id)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-bold">Reverse…</button> : null}</td>
              </tr>
              {reversing === row.id ? <tr className="bg-slate-50"><td colSpan={9} className="p-3">
                <form onSubmit={(event) => reverse(event, row)} className="flex flex-wrap items-end gap-3 text-sm">
                  <label className="grow font-semibold">Why is entry #{row.entry_no} being reversed? (required)<input name="note" required minLength={3} maxLength={1000} className="mt-1 block w-full rounded-lg border border-slate-200 px-2 py-1.5" /></label>
                  <button disabled={busy} className="rounded-lg bg-rose-700 px-3 py-1.5 font-bold text-white disabled:opacity-50">Post reversal of {formatMoney(fromMinor(-toMinor(row.amount)), row.currency)}</button>
                </form>
              </td></tr> : null}
            </Fragment>)}
            {!ledgerRows.length ? <tr><td colSpan={9} className="py-6 text-center text-slate-500">No ledger entries match these filters.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  </div>;
}
