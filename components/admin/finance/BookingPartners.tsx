"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Pencil, UserMinus } from "lucide-react";
import { notifyAdminBookingsChanged } from "@/lib/admin-booking-events";
import { FINANCE_CURRENCIES, formatMoney, fromMinor, toMinor, type FinanceCurrency } from "@/lib/finance/money";
import { partnerTypeLabels, type PartnerKind } from "@/lib/partner-record";
import TaxRateSelect, { useTaxRates } from "@/components/admin/finance/TaxRateSelect";

type Amount = string | number;
type Line = {
  id: string; line_no: number; tour_name: string | null; trip_date: string | null; currency: FinanceCurrency; net_selling_price: Amount;
  outcome: string; included: boolean; supplier_id: string | null; supplier_cost: Amount; supplier_cost_currency: FinanceCurrency;
  supplier_cost_source: string; supplier_cancellation_fee: Amount; collected_by: "daily_red_sea" | "supplier";
  recognised_revenue: Amount; recognised_supplier_cost: Amount; extra_partner_cost_booking_ccy: Amount | null;
  margin_amount: Amount | null; margin_pct: Amount | null;
  sales_tax_rate_id: string | null; sales_tax_amount: Amount; purchase_tax_rate_id: string | null; purchase_tax_amount: Amount;
};
type PartnerCost = {
  id: string; line_id: string; supplier_id: string; role: PartnerKind; cost: Amount; currency: FinanceCurrency; cancellation_fee: Amount;
  cost_source: string; status: "active" | "removed"; removed_reason: string | null; note: string | null; recognised_cost: Amount;
  tax_rate_id: string | null; tax_amount: Amount;
  suppliers: { name: string } | { name: string }[] | null;
};
type Supplier = { id: string; name: string; type: string; active: boolean; default_currency: string };
type Data = { lines: Line[]; partnerCosts: PartnerCost[]; suppliers: Supplier[]; canManage: boolean };

const roles = Object.entries(partnerTypeLabels) as [PartnerKind, string][];
const field = "mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-base font-normal sm:text-sm";
const show = (amount: Amount, currency: FinanceCurrency) => formatMoney(fromMinor(toMinor(amount)), currency);
const partnerName = (row: PartnerCost) => (Array.isArray(row.suppliers) ? row.suppliers[0]?.name : row.suppliers?.name) || "Partner";
const outcomeNote: Record<string, string> = {
  pending: "Booking not confirmed yet: nothing is owed to partners until it is.",
  cancelled: "Cancelled: partners are owed only their cancellation fee.",
};

async function send(url: string, method: string, body: unknown) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Nothing was saved.");
  return data;
}

/** Who delivered each trip on a booking and what they cost: the main partner plus extra partners. Finance staff only. */
export default function BookingPartners({ bookingId }: { bookingId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [mainEditing, setMainEditing] = useState<string | null>(null);
  const taxRates = useTaxRates();

  const load = useCallback(async () => {
    const response = await fetch(`/api/admin/finance/bookings/${bookingId}/partners`, { cache: "no-store" });
    if (response.status === 401 || response.status === 403) { setHidden(true); return; }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Could not load partners.");
    setData(body);
  }, [bookingId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- partners are loaded from the protected API after mount
  useEffect(() => { load().catch((reason: Error) => setError(reason.message)); }, [load]);

  async function run(work: () => Promise<unknown>, done: string) {
    setBusy(true); setError(""); setNotice("");
    try {
      await work();
      setNotice(done);
      setAdding(null); setEditing(null); setMainEditing(null);
      notifyAdminBookingsChanged();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Nothing was saved.");
    } finally {
      setBusy(false);
    }
  }

  function addPartner(event: FormEvent<HTMLFormElement>, line: Line) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    void run(() => send(`/api/admin/finance/lines/${line.id}/partners`, "POST", {
      supplier_id: form.supplier_id, role: form.role, cost: form.cost, currency: form.cost ? form.currency : "",
      cancellation_fee: form.cancellation_fee || "0", note: form.note,
    }), "Partner added to the trip.");
  }
  function updatePartner(event: FormEvent<HTMLFormElement>, row: PartnerCost) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    void run(() => send(`/api/admin/finance/partner-costs/${row.id}`, "PATCH", {
      cost: form.cost, currency: form.currency, cancellation_fee: form.cancellation_fee || "0", role: form.role,
    }), "Partner cost updated.");
  }
  function removePartner(row: PartnerCost) {
    const reason = window.prompt(`Take ${partnerName(row)} off this trip? What they were owed is reversed; the record is kept. Reason:`);
    if (reason === null) return;
    if (reason.trim().length < 3) { setError("Enter a reason (at least 3 characters)."); return; }
    void run(() => send(`/api/admin/finance/partner-costs/${row.id}/remove`, "POST", { reason: reason.trim() }), `${partnerName(row)} removed from the trip.`);
  }
  function updateMain(event: FormEvent<HTMLFormElement>, line: Line) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    void run(() => send(`/api/admin/finance/lines/${line.id}`, "PATCH", {
      supplier_cost: { mode: "amount", amount: form.cost, currency: form.currency },
      supplier_cancellation_fee: form.cancellation_fee || "0",
      collected_by: form.collected_by,
    }), "Main partner updated.");
  }

  function setTax(target: "sales" | "main_partner" | "partner_cost", id: string, taxRateId: string | null) {
    void run(() => send("/api/admin/finance/tax", "POST", { target, id, tax_rate_id: taxRateId }), taxRateId ? "VAT rate set." : "VAT removed.");
  }

  if (hidden) return null;
  const suppliers = data?.suppliers ?? [];
  const supplierName = (id: string | null) => suppliers.find((supplier) => supplier.id === id)?.name ?? "Not assigned";

  return (
    <section aria-labelledby="booking-partners-title" className="rounded-2xl border-2 border-teal-200 bg-teal-50 p-4 sm:p-5">
      <b id="booking-partners-title" className="text-xs uppercase tracking-wider text-teal-900">Partners & costs</b>
      <p className="mt-1 text-sm text-teal-900">Everyone who delivers the trip and what they are owed. The main partner is set with the Supplier field below.</p>
      {error ? <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {notice ? <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p> : null}
      {!data ? <p role="status" className="mt-3 text-sm">{error ? "" : "Loading partners…"}</p> : data.lines.map((line) => {
        const extras = data.partnerCosts.filter((row) => row.line_id === line.id);
        const active = extras.filter((row) => row.status === "active");
        const available = suppliers.filter((supplier) => supplier.active && supplier.id !== line.supplier_id && !active.some((row) => row.supplier_id === supplier.id));
        return (
          <div key={line.id} className="mt-4 rounded-xl bg-white p-3 sm:p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-bold">{data.lines.length > 1 ? `Trip ${line.line_no}: ` : ""}{line.tour_name || "Trip"}{line.trip_date ? <span className="font-normal text-slate-500"> · {line.trip_date}</span> : null}</p>
              <p className="text-sm text-slate-600">Net price {show(line.net_selling_price, line.currency)}</p>
            </div>
            {outcomeNote[line.outcome] ? <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs font-semibold text-amber-900">{outcomeNote[line.outcome]}</p> : null}

            <ul className="mt-3 divide-y divide-slate-100 text-sm">
              <li className="py-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{supplierName(line.supplier_id)} <span className="text-xs font-normal text-slate-500">main partner · guest paid {line.collected_by === "daily_red_sea" ? "Daily Red Sea" : "the partner"}</span></p>
                    {line.supplier_id ? <p className="text-xs text-slate-500">
                      Cost {line.supplier_cost_source === "none" ? "not set" : show(line.supplier_cost, line.supplier_cost_currency)}
                      {toMinor(line.supplier_cancellation_fee) > 0n ? ` · cancellation fee ${show(line.supplier_cancellation_fee, line.supplier_cost_currency)}` : ""}
                    </p> : null}
                  </div>
                  {data.canManage && line.supplier_id ? (
                    <button type="button" onClick={() => setMainEditing(mainEditing === line.id ? null : line.id)} aria-label="Edit main partner cost" title="Edit"
                      className="rounded-lg p-2 text-slate-400 hover:bg-teal-50 hover:text-teal-800"><Pencil size={16} /></button>
                  ) : null}
                </div>
                {mainEditing === line.id ? (
                  <form onSubmit={(event) => updateMain(event, line)} className="mt-2 grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
                    <label className="text-sm font-semibold">Cost<input name="cost" required inputMode="decimal" pattern="\d+(\.\d{1,2})?" defaultValue={line.supplier_cost_source === "none" ? "" : fromMinor(toMinor(line.supplier_cost))} className={field} /></label>
                    <label className="text-sm font-semibold">Currency<select name="currency" defaultValue={line.supplier_cost_currency} className={field}>{FINANCE_CURRENCIES.map((code) => <option key={code}>{code}</option>)}</select></label>
                    <label className="text-sm font-semibold">Guest paid<select name="collected_by" defaultValue={line.collected_by} className={field}><option value="daily_red_sea">Daily Red Sea</option><option value="supplier">The partner</option></select></label>
                    <label className="text-sm font-semibold">Cancellation fee<input name="cancellation_fee" inputMode="decimal" pattern="\d+(\.\d{1,2})?" defaultValue={fromMinor(toMinor(line.supplier_cancellation_fee))} className={field} /></label>
                    <button disabled={busy} className="rounded-xl bg-teal-700 p-3 font-bold text-white disabled:opacity-60 sm:col-span-2">{busy ? "Saving…" : "Save main partner"}</button>
                  </form>
                ) : null}
              </li>
              {extras.map((row) => (
                <li key={row.id} className={`py-2 ${row.status === "removed" ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{partnerName(row)} <span className="text-xs font-normal text-slate-500">{partnerTypeLabels[row.role] ?? row.role}{row.cost_source === "supplier_price" ? " · price list" : ""}</span>
                        {row.status === "removed" ? <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">Removed</span> : null}</p>
                      <p className="text-xs text-slate-500">
                        Cost {show(row.cost, row.currency)}{toMinor(row.cancellation_fee) > 0n ? ` · cancellation fee ${show(row.cancellation_fee, row.currency)}` : ""}
                        {row.status === "removed" && row.removed_reason ? ` · ${row.removed_reason}` : ""}
                        {toMinor(row.tax_amount) > 0n ? ` · VAT ${show(row.tax_amount, row.currency)}` : ""}
                      </p>
                      {taxRates?.length && data.canManage && row.status === "active" ? (
                        <TaxRateSelect rates={taxRates} kind="purchases" date={line.trip_date} value={row.tax_rate_id} disabled={busy}
                          onChange={(id) => setTax("partner_cost", row.id, id)} label="VAT on this cost" className="mt-1 block max-w-xs text-xs font-semibold text-slate-600" />
                      ) : null}
                    </div>
                    {data.canManage && row.status === "active" ? (
                      <div className="flex shrink-0">
                        <button type="button" onClick={() => setEditing(editing === row.id ? null : row.id)} aria-label={`Edit ${partnerName(row)}`} title="Edit"
                          className="rounded-lg p-2 text-slate-400 hover:bg-teal-50 hover:text-teal-800"><Pencil size={16} /></button>
                        <button type="button" disabled={busy} onClick={() => removePartner(row)} aria-label={`Remove ${partnerName(row)}`} title="Remove from trip"
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"><UserMinus size={16} /></button>
                      </div>
                    ) : null}
                  </div>
                  {editing === row.id ? (
                    <form onSubmit={(event) => updatePartner(event, row)} className="mt-2 grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
                      <label className="text-sm font-semibold">Role<select name="role" defaultValue={row.role} className={field}>{roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                      <label className="text-sm font-semibold">Cost<input name="cost" required inputMode="decimal" pattern="\d+(\.\d{1,2})?" defaultValue={fromMinor(toMinor(row.cost))} className={field} /></label>
                      <label className="text-sm font-semibold">Currency<select name="currency" defaultValue={row.currency} className={field}>{FINANCE_CURRENCIES.map((code) => <option key={code}>{code}</option>)}</select></label>
                      <label className="text-sm font-semibold">Cancellation fee<input name="cancellation_fee" inputMode="decimal" pattern="\d+(\.\d{1,2})?" defaultValue={fromMinor(toMinor(row.cancellation_fee))} className={field} /></label>
                      <button disabled={busy} className="rounded-xl bg-teal-700 p-3 font-bold text-white disabled:opacity-60 sm:col-span-2">{busy ? "Saving…" : "Save"}</button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>

            {taxRates?.length ? (
              <div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
                <div>
                  <TaxRateSelect rates={taxRates} kind="sales" date={line.trip_date} value={line.sales_tax_rate_id} disabled={busy || !data.canManage}
                    onChange={(id) => setTax("sales", line.id, id)} label="VAT on the sale" />
                  <p className="mt-1 text-xs text-slate-500">VAT {show(line.sales_tax_amount, line.currency)}</p>
                </div>
                {line.supplier_id ? (
                  <div>
                    <TaxRateSelect rates={taxRates} kind="purchases" date={line.trip_date} value={line.purchase_tax_rate_id} disabled={busy || !data.canManage}
                      onChange={(id) => setTax("main_partner", line.id, id)} label="VAT on the main partner's cost" />
                    <p className="mt-1 text-xs text-slate-500">VAT {show(line.purchase_tax_amount, line.supplier_cost_currency)}</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-slate-50 p-2"><dt className="text-slate-500">Revenue</dt><dd className="font-bold">{show(line.recognised_revenue, line.currency)}</dd></div>
              <div className="rounded-lg bg-slate-50 p-2"><dt className="text-slate-500">Extra partners</dt><dd className="font-bold">{line.extra_partner_cost_booking_ccy === null ? "Rate pending" : show(line.extra_partner_cost_booking_ccy, line.currency)}</dd></div>
              <div className="rounded-lg bg-slate-50 p-2"><dt className="text-slate-500">Margin</dt><dd className={`font-bold ${line.margin_amount !== null && toMinor(line.margin_amount) < 0n ? "text-rose-700" : ""}`}>{line.margin_amount === null ? "Rate pending" : `${show(line.margin_amount, line.currency)}${line.margin_pct === null ? "" : ` · ${line.margin_pct}%`}`}</dd></div>
            </dl>

            {data.canManage && line.outcome !== "removed" ? (adding === line.id ? (
              <form onSubmit={(event) => addPartner(event, line)} className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
                <label className="text-sm font-semibold sm:col-span-2">Partner
                  <select name="supplier_id" required defaultValue="" className={field}
                    onChange={(event) => {
                      const type = suppliers.find((supplier) => supplier.id === event.target.value)?.type;
                      const role = event.currentTarget.form?.elements.namedItem("role") as HTMLSelectElement | null;
                      if (role && type && roles.some(([value]) => value === type)) role.value = type;
                      const currency = event.currentTarget.form?.elements.namedItem("currency") as HTMLSelectElement | null;
                      const preferred = suppliers.find((supplier) => supplier.id === event.target.value)?.default_currency?.toUpperCase();
                      if (currency && preferred && (FINANCE_CURRENCIES as readonly string[]).includes(preferred)) currency.value = preferred;
                    }}>
                    <option value="" disabled>Choose…</option>
                    {available.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name} · {partnerTypeLabels[supplier.type as PartnerKind] ?? supplier.type}</option>)}
                  </select>
                </label>
                <label className="text-sm font-semibold">Role<select name="role" defaultValue="guide" className={field}>{roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="text-sm font-semibold">Cost <span className="font-normal text-slate-500">blank = their price list</span><input name="cost" inputMode="decimal" pattern="\d+(\.\d{1,2})?" className={field} /></label>
                <label className="text-sm font-semibold">Currency<select name="currency" defaultValue="EGP" className={field}>{FINANCE_CURRENCIES.map((code) => <option key={code}>{code}</option>)}</select></label>
                <label className="text-sm font-semibold">Cancellation fee <span className="font-normal text-slate-500">if the trip is cancelled</span><input name="cancellation_fee" inputMode="decimal" pattern="\d+(\.\d{1,2})?" placeholder="0" className={field} /></label>
                <label className="text-sm font-semibold sm:col-span-2">Note <span className="font-normal text-slate-500">optional</span><input name="note" maxLength={500} className={field} /></label>
                <div className="flex gap-2 sm:col-span-2">
                  <button disabled={busy} className="grow rounded-xl bg-teal-700 p-3 font-bold text-white disabled:opacity-60">{busy ? "Saving…" : "Add to trip"}</button>
                  <button type="button" onClick={() => setAdding(null)} className="rounded-xl border border-slate-300 px-4 font-bold">Cancel</button>
                </div>
              </form>
            ) : (
              <button type="button" onClick={() => { setAdding(line.id); setError(""); }} disabled={!available.length}
                className="mt-3 w-full rounded-xl border-2 border-dashed border-teal-300 p-3 text-sm font-bold text-teal-800 disabled:opacity-50">
                {available.length ? "+ Add guide, driver, hotel or other partner" : "All active partners are already on this trip"}
              </button>
            )) : null}
          </div>
        );
      })}
    </section>
  );
}
