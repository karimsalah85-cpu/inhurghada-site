"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { formatMoney, fromMinor, toMinor } from "@/lib/finance/money";
import { loadTaxRates, type TaxRate } from "@/components/admin/finance/TaxRateSelect";

type Amount = string | number | null;
type Country = { country: string; name: string; is_home: boolean; destinations: string[]; filing_frequency: "monthly" | "quarterly"; filing_due_months: number };
type Month = { country: string; country_name: string; filing_due_on: string; filing_frequency: string; month: string; output_vat_usd: Amount; input_vat_usd: Amount; net_vat_usd: Amount; output_items: number; input_items: number; usd_pending: number };
const field = "mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-base font-normal sm:text-sm";
const usd = (value: Amount) => formatMoney(fromMinor(value === null || value === undefined ? 0n : toMinor(value)), "USD");
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
const kindLabel = { sales: "Sales", purchases: "Purchases", both: "Sales & purchases" } as const;
const dayLabel = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const monthLabel = (month: string) => new Date(`${month}T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

async function send(url: string, method: string, body: unknown) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Nothing was saved.");
  return data;
}

export default function FinanceVat() {
  const year = new Date().getFullYear();
  const [rates, setRates] = useState<TaxRate[] | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [months, setMonths] = useState<Month[] | null>(null);
  const [from, setFrom] = useState(`${year}-01-01`);
  const [to, setTo] = useState(`${year}-12-31`);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadRates = useCallback(async () => {
    const response = await fetch("/api/admin/finance/tax-rates", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Could not load VAT rates.");
    setRates(body.taxRates); setCountries(body.countries ?? []); setCanManage(Boolean(body.canManage));
    void loadTaxRates(true);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- rates are loaded from the protected API after mount
  useEffect(() => { loadRates().catch((reason: Error) => setError(reason.message)); }, [loadRates]);
  useEffect(() => {
    fetch(`/api/admin/finance/vat?${new URLSearchParams({ from, to })}`, { cache: "no-store" })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error); setMonths(body.rows); })
      .catch((reason: Error) => setError(reason.message || "Could not load the VAT report."));
  }, [from, to]);

  async function run(work: () => Promise<unknown>, done: string) {
    setBusy(true); setError(""); setNotice("");
    try { await work(); setNotice(done); setAdding(false); await loadRates(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Nothing was saved."); }
    finally { setBusy(false); }
  }
  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void run(() => send("/api/admin/finance/tax-rates", "POST", {
      code: form.get("code"), name: form.get("name"), rate_percent: form.get("rate_percent"), applies_to: form.get("applies_to"),
      effective_from: form.get("effective_from"), effective_to: form.get("effective_to"), note: form.get("note"), country: form.get("country"),
      default_for_sales: form.get("default_for_sales") === "on", default_for_purchases: form.get("default_for_purchases") === "on",
    }), "VAT rate added.");
  }
  function endRate(rate: TaxRate) {
    const date = window.prompt(`End ${rate.name} on which date (YYYY-MM-DD)? Transactions keep the rate they already have.`, today());
    if (!date) return;
    void run(() => send(`/api/admin/finance/tax-rates/${rate.id}`, "PATCH", { effective_to: date }), `${rate.name} ends on ${date}.`);
  }
  function toggleDefault(rate: TaxRate, key: "default_for_sales" | "default_for_purchases") {
    void run(() => send(`/api/admin/finance/tax-rates/${rate.id}`, "PATCH", { [key]: !rate[key] }), "Default updated.");
  }

  const total = (key: keyof Month) => (months ?? []).reduce((sum, month) => sum + (month[key] === null ? 0n : toMinor(month[key] as string | number)), 0n);

  return (
    <div className="space-y-6">
      {error ? <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {notice ? <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p> : null}

      <section className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black">VAT rates</h2>
          {canManage && !adding ? <button type="button" onClick={() => setAdding(true)} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Add rate</button> : null}
        </div>
        <p className="mt-1 text-sm text-slate-600">Guest prices and expenses include VAT: VAT is the part of each amount at its rate. A partner&apos;s VAT follows their VAT status on their partner page (not registered: none; registered: included in or added on top of their price). Each country&apos;s default rates apply to new trips there; expenses use {countries.find((country) => country.is_home)?.name || "the home country"}&apos;s. A rate&apos;s percent never changes; end it and add a new one.</p>
        {countries.length ? (
          <ul className="mt-3 flex flex-wrap gap-2 text-xs">
            {countries.map((country) => (
              <li key={country.country} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                <span className="font-bold">{country.name}</span> · {country.destinations.map((slug) => slug.replace(/-/g, " ")).join(", ") || "no destinations"} · {country.filing_frequency} return, due {country.filing_due_months} month{country.filing_due_months === 1 ? "" : "s"} after the period
              </li>
            ))}
          </ul>
        ) : null}

        {adding ? (
          <form onSubmit={create} className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">Name<input name="name" required minLength={2} maxLength={80} placeholder="e.g. Standard VAT" className={field} /></label>
            <label className="text-sm font-semibold">Code<input name="code" required pattern="[A-Za-z0-9_\-]{2,20}" placeholder="e.g. VAT-STD" className={field} /></label>
            <label className="text-sm font-semibold">Percent<input name="rate_percent" required inputMode="decimal" pattern="\d{1,3}(\.\d{1,4})?" placeholder="as confirmed by your accountant" className={field} /></label>
            <label className="text-sm font-semibold">Applies to<select name="applies_to" defaultValue="both" className={field}><option value="sales">Sales</option><option value="purchases">Purchases</option><option value="both">Sales & purchases</option></select></label>
            <label className="text-sm font-semibold">Country<select name="country" defaultValue={countries.find((country) => country.is_home)?.country ?? ""} className={field}><option value="">Any country</option>{countries.map((country) => <option key={country.country} value={country.country}>{country.name}</option>)}</select></label>
            <label className="text-sm font-semibold">Valid from<input name="effective_from" type="date" required defaultValue={today()} className={field} /></label>
            <label className="text-sm font-semibold">Valid until <span className="font-normal text-slate-500">optional</span><input name="effective_to" type="date" className={field} /></label>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="default_for_sales" /> Default for new sales</label>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="default_for_purchases" /> Default for new purchases</label>
            <label className="text-sm font-semibold sm:col-span-2">Note <span className="font-normal text-slate-500">optional, e.g. what the accountant confirmed</span><input name="note" maxLength={500} className={field} /></label>
            <div className="flex gap-2 sm:col-span-2">
              <button disabled={busy} className="grow rounded-xl bg-cyan-700 p-3 font-bold text-white disabled:opacity-60">{busy ? "Saving…" : "Add VAT rate"}</button>
              <button type="button" onClick={() => setAdding(false)} className="rounded-xl border border-slate-300 px-4 font-bold">Cancel</button>
            </div>
          </form>
        ) : null}

        {!rates ? <p role="status" className="mt-4 text-sm">Loading…</p> : rates.length ? (
          <ul className="mt-4 space-y-3">
            {rates.map((rate) => {
              const ended = rate.effective_to !== null && rate.effective_to < today();
              return (
                <li key={rate.id} className={`rounded-2xl border border-slate-200 p-4 text-sm ${ended ? "bg-slate-50 opacity-70" : ""}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{rate.name} <span className="font-mono text-xs text-slate-500">{rate.code}</span></p>
                      <p className="text-slate-600">{Number(rate.rate_percent)}% · {countries.find((country) => country.country === rate.country)?.name || "Any country"} · {kindLabel[rate.applies_to]} · from {rate.effective_from}{rate.effective_to ? ` until ${rate.effective_to}` : ""}</p>
                      {rate.default_for_sales || rate.default_for_purchases ? <p className="mt-1 text-xs font-semibold text-cyan-800">Default for {[rate.default_for_sales && "new sales", rate.default_for_purchases && "new purchases"].filter(Boolean).join(" and ")}</p> : null}
                    </div>
                    {canManage && !ended ? (
                      <div className="flex flex-wrap gap-2">
                        {rate.applies_to !== "purchases" ? <button type="button" disabled={busy} onClick={() => toggleDefault(rate, "default_for_sales")} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-bold">{rate.default_for_sales ? "Unset sales default" : "Make sales default"}</button> : null}
                        {rate.applies_to !== "sales" ? <button type="button" disabled={busy} onClick={() => toggleDefault(rate, "default_for_purchases")} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-bold">{rate.default_for_purchases ? "Unset purchases default" : "Make purchases default"}</button> : null}
                        <button type="button" disabled={busy} onClick={() => endRate(rate)} className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-bold text-rose-700">End rate</button>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">No VAT rates set up yet, so no VAT is recorded anywhere.</p>}
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-black">VAT returns (USD)</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-md">
          <label className="text-sm font-semibold">From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={field} /></label>
          <label className="text-sm font-semibold">To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className={field} /></label>
        </div>
        {!months ? <p role="status" className="mt-4 text-sm">Loading…</p> : months.length ? (
          <>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">VAT on sales</dt><dd className="font-black">{usd(fromMinor(total("output_vat_usd")))}</dd></div>
              <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">VAT on purchases</dt><dd className="font-black">{usd(fromMinor(total("input_vat_usd")))}</dd></div>
              <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">Net VAT</dt><dd className="font-black">{usd(fromMinor(total("net_vat_usd")))}</dd></div>
            </dl>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-xs text-slate-500"><th className="py-2">Month</th><th>On sales</th><th>On purchases</th><th>Net</th><th className="hidden sm:table-cell">Items</th></tr></thead>
                <tbody>{months.map((month) => (
                  <tr key={`${month.country}-${month.month}`} className="border-b last:border-0">
                    <td className="py-2 pr-2"><span className="font-semibold">{monthLabel(month.month)}</span>{countries.length > 1 ? <span className="block text-xs text-slate-500">{month.country_name}</span> : null}<span className="block text-xs text-slate-500">Return due {dayLabel(month.filing_due_on)}</span></td><td>{usd(month.output_vat_usd)}</td><td>{usd(month.input_vat_usd)}</td>
                    <td className="font-bold">{usd(month.net_vat_usd)}</td>
                    <td className="hidden text-xs text-slate-500 sm:table-cell">{month.output_items + month.input_items}{month.usd_pending ? ` · ${month.usd_pending} awaiting rate` : ""}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-slate-500">Sales VAT is counted at the tax point: money a guest pays before the trip carries its share of VAT in the month it was received, the rest falls in the trip month. Partner VAT by trip date, expenses by expense date. VAT is in USD here; the return itself is filed in the local currency.</p>
          </>
        ) : <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No VAT recorded in this period.</p>}
      </section>
    </div>
  );
}
