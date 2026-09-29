"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FINANCE_CURRENCIES, formatMoney, toMinor, type FinanceCurrency } from "@/lib/finance/money";
import { isValidRate, usdToDisplay } from "@/lib/finance/display-currency";
import type { MarginRow } from "@/lib/finance/pnl";

type Amount = string | number | null;
type Month = { month: string; cash_in_usd: Amount; cash_out_usd: Amount; net_cash_usd: Amount; usd_pending: number };
type Dashboard = {
  configured: boolean; error?: string;
  pnl: { totals: Record<string, string>; bookings: number; pending: { lines: number; expenses: number } };
  cashFlow: { months: Month[]; cash_in_usd: string; cash_out_usd: string; net_cash_usd: string; usd_pending: number };
  partners: { we_owe_usd: string; owed_to_us_usd: string; top: { id: string; name: string; usd_balance: string }[]; missing_rates: string[] };
  byTour: MarginRow[]; byDestination: MarginRow[];
  cancellations: { bookings: number; lost_sales_usd: string; retained_usd: string; net_cost_usd: string };
  vat: { output_vat_usd: string; input_vat_usd: string; net_vat_usd: string };
  rates: Partial<Record<FinanceCurrency, { units_per_usd: string; rate_date: string }>>;
};

const field = "mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-base font-normal sm:text-sm";
const monthStart = () => `${new Date().toISOString().slice(0, 8)}01`;
const today = () => new Date().toISOString().slice(0, 10);
const monthLabel = (month: string) => new Date(`${month}T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
const presets = [
  ["This month", () => [monthStart(), today()]],
  ["Last month", () => { const d = new Date(); const first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)); const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 0)); return [first.toISOString().slice(0, 10), last.toISOString().slice(0, 10)]; }],
  ["This year", () => [`${new Date().getUTCFullYear()}-01-01`, today()]],
] as const;

function Tile({ label, value, note, tone, className = "" }: { label: string; value: string; note?: string; tone?: "good" | "bad"; className?: string }) {
  return (
    <div className={`min-w-0 rounded-2xl border border-slate-200 bg-white p-4 ${className}`}>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className={`mt-1 whitespace-nowrap text-lg font-black tabular-nums sm:text-2xl ${tone === "bad" ? "text-rose-700" : "text-slate-950"}`}>{value}</p>
      {note ? <p className="mt-1 text-xs text-slate-500">{note}</p> : null}
    </div>
  );
}

function Bars({ rows, money, empty }: { rows: MarginRow[]; money: (usd: Amount) => string; empty: string }) {
  const shown = rows.slice(0, 10);
  const max = shown.reduce((top, row) => (toMinor(row.net_sales) > top ? toMinor(row.net_sales) : top), 0n);
  if (!shown.length) return <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{empty}</p>;
  return (
    <ul className="mt-3 space-y-3">
      {shown.map((row) => {
        const width = max > 0n ? Number((toMinor(row.net_sales) * 1000n) / max) / 10 : 0;
        return (
          <li key={row.key} title={`${row.label}: revenue excl. VAT ${money(row.net_sales)}, margin ${money(row.margin)}${row.margin_pct === null ? "" : ` (${row.margin_pct}%)`}, profit after linked expenses ${money(row.profit)}, ${row.bookings} booking(s)`}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-semibold text-slate-900">{row.label}</span>
              <span className="shrink-0 tabular-nums text-slate-900">{money(row.net_sales)}</span>
            </div>
            <div className="mt-1 h-2.5 rounded-full bg-slate-100" aria-hidden="true">
              <div className="h-2.5 rounded-full bg-cyan-700" style={{ width: `${Math.max(width, 1)}%` }} />
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Margin {money(row.margin)}{row.margin_pct === null ? "" : ` · ${row.margin_pct}%`}{row.direct_expenses && row.direct_expenses !== "0.00" ? ` · after linked expenses ${money(row.profit)}` : ""} · {row.bookings} booking{row.bookings === 1 ? "" : "s"}
              {row.flag === "negative" ? <span className="ml-1 font-semibold text-rose-700">· losing money</span> : row.flag === "below_threshold" ? <span className="ml-1 font-semibold text-amber-800">· low margin</span> : null}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export default function FinanceDashboard() {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<FinanceCurrency>("USD");
  const [rate, setRate] = useState("1");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/admin/finance/dashboard?${new URLSearchParams({ from, to })}`, { cache: "no-store" })
        .then(async (response) => {
          const body = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(body.error || "Could not load the reports.");
          setError(""); setData(body);
        })
        .catch((reason: Error) => setError(reason.message))
        .finally(() => setLoading(false));
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [from, to]);

  function chooseCurrency(next: FinanceCurrency) {
    setCurrency(next);
    setRate(next === "USD" ? "1" : (data?.rates[next]?.units_per_usd ?? "").replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, ""));
  }

  const rateOk = currency === "USD" || isValidRate(rate);
  const money = useMemo(() => (usd: Amount) => {
    if (usd === null || usd === undefined) return "—";
    if (currency === "USD" || !rateOk) return formatMoney(String(usd), "USD");
    return formatMoney(usdToDisplay(usd, rate) ?? "0", currency);
  }, [currency, rate, rateOk]);

  const totals = data?.pnl.totals;
  const pending = data ? data.pnl.pending.lines + data.pnl.pending.expenses + data.cashFlow.usd_pending : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-semibold">From<input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} className={field} /></label>
          <label className="text-sm font-semibold">To<input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} className={field} /></label>
          <label className="text-sm font-semibold">Show amounts in
            <select value={currency} onChange={(event) => chooseCurrency(event.target.value as FinanceCurrency)} className={field}>
              {FINANCE_CURRENCIES.map((code) => <option key={code} value={code}>{code}{code === "USD" ? " (base)" : ""}</option>)}
            </select>
          </label>
          {currency !== "USD" ? (
            <label className="text-sm font-semibold">1 USD = … {currency}
              <input inputMode="decimal" value={rate} onChange={(event) => setRate(event.target.value)} className={`${field} ${rateOk ? "" : "border-rose-400"}`} />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                {data?.rates[currency] ? `Latest stored rate ${data.rates[currency]!.rate_date}; type another to consolidate at your own rate.` : "No stored rate yet; type the rate to use."}
              </span>
            </label>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {presets.map(([label, range]) => (
            <button key={label} type="button" onClick={() => { const [a, b] = range(); setFrom(a); setTo(b); }}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700">{label}</button>
          ))}
          <span className="grow" />
          <a href={`/api/admin/finance/export?${new URLSearchParams({ from, to })}`} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Export all transactions (CSV)</a>
        </div>
        {currency !== "USD" ? <p className="mt-3 text-xs text-slate-600">Reports are kept in USD; figures are shown in {currency} at {rateOk ? `1 USD = ${rate} ${currency}` : "a rate you still need to enter (showing USD)"}. The CSV stays in original currencies and USD.</p> : null}
      </section>

      {error ? <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {!data || !totals ? <p role="status" className="text-sm">{error ? "" : "Loading reports…"}</p> : (
        <div className={`space-y-6 ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
          {pending ? <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{pending} item(s) are waiting for an exchange rate and are not in these totals yet.</p> : null}

          <section>
            <div className="flex items-baseline justify-between gap-2"><h2 className="text-lg font-black">Profit & loss</h2><Link href="/admin/finance/pnl" className="text-sm font-semibold text-cyan-800 underline">Full P&amp;L</Link></div>
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Tile label="Revenue excl. VAT" value={money(totals.revenue ?? totals.net_sales)} note={`${data.pnl.bookings} booking(s), by trip date`} />
              <Tile label="Partner costs" value={money(totals.supplier_costs)} />
              <Tile label="Gross profit" value={money(totals.gross_profit)} tone={toMinor(totals.gross_profit) < 0n ? "bad" : undefined} />
              <Tile label="Business expenses" value={money(totals.opex)} />
              <Tile label="Net profit" value={money(totals.net_profit)} tone={toMinor(totals.net_profit) < 0n ? "bad" : undefined} note="after commissions & fees" className="col-span-2 lg:col-span-1" />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-black">Cash in vs cash out</h2>
            <p className="text-sm text-slate-600">Money that actually moved: guest payments and refunds, partner payments and receipts, expenses. Credit notes are not cash.</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Tile label="Cash in" value={money(data.cashFlow.cash_in_usd)} />
              <Tile label="Cash out" value={money(data.cashFlow.cash_out_usd)} />
              <Tile label="Net cash" value={money(data.cashFlow.net_cash_usd)} tone={toMinor(data.cashFlow.net_cash_usd) < 0n ? "bad" : undefined} className="col-span-2 sm:col-span-1" />
            </div>
            {data.cashFlow.months.length > 1 ? (
              <table className="mt-4 w-full text-sm">
                <thead><tr className="border-b text-left text-xs text-slate-500"><th className="py-2">Month</th><th className="text-right">In</th><th className="text-right">Out</th><th className="text-right">Net</th></tr></thead>
                <tbody>{data.cashFlow.months.map((month) => (
                  <tr key={month.month} className="border-b last:border-0 tabular-nums">
                    <td className="py-2 font-semibold">{monthLabel(month.month)}</td><td className="text-right">{money(month.cash_in_usd)}</td><td className="text-right">{money(month.cash_out_usd)}</td>
                    <td className={`text-right font-bold ${toMinor(month.net_cash_usd ?? 0) < 0n ? "text-rose-700" : ""}`}>{money(month.net_cash_usd)}</td>
                  </tr>
                ))}</tbody>
              </table>
            ) : null}
          </section>

          <section className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-baseline justify-between gap-2"><h2 className="text-lg font-black">Partner balances today</h2><Link href="/admin/finance/suppliers" className="text-sm font-semibold text-cyan-800 underline">All partners</Link></div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Tile label="We owe partners" value={money(data.partners.we_owe_usd)} />
              <Tile label="Partners owe us" value={money(data.partners.owed_to_us_usd)} />
            </div>
            {data.partners.top.length ? (
              <ul className="mt-3 divide-y divide-slate-100 text-sm">
                {data.partners.top.map((partner) => (
                  <li key={partner.id}><Link href={`/admin/finance/suppliers/${partner.id}`} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0 truncate font-semibold">{partner.name}</span>
                    <span className="shrink-0 tabular-nums">{toMinor(partner.usd_balance) < 0n ? `we owe ${money(String(partner.usd_balance).replace("-", ""))}` : `owes us ${money(partner.usd_balance)}`}</span>
                  </Link></li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm text-slate-500">All partners are settled.</p>}
            <p className="mt-2 text-xs text-slate-500">Converted to USD at today&apos;s rates{data.partners.missing_rates.length ? `; no rate yet for ${data.partners.missing_rates.join(", ")}` : ""}.</p>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-baseline justify-between gap-2"><h2 className="text-lg font-black">Revenue by tour</h2><Link href="/admin/finance/margins" className="text-sm font-semibold text-cyan-800 underline">Margins</Link></div>
              <Bars rows={data.byTour} money={money} empty="No trips in this period." />
            </section>
            <section className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-lg font-black">Revenue by location</h2>
              <Bars rows={data.byDestination} money={money} empty="No trips in this period." />
            </section>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <section className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-baseline justify-between gap-2"><h2 className="text-lg font-black">Cancellations</h2><Link href="/admin/finance/cancellations" className="text-sm font-semibold text-cyan-800 underline">Details</Link></div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Tile label="Sales lost" value={money(data.cancellations.lost_sales_usd)} note={`${data.cancellations.bookings} cancelled booking(s)`} />
                <Tile label="Net cost" value={money(data.cancellations.net_cost_usd)} note="partner fees + payment fees − kept" />
              </div>
            </section>
            <section className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-baseline justify-between gap-2"><h2 className="text-lg font-black">VAT</h2><Link href="/admin/finance/vat" className="text-sm font-semibold text-cyan-800 underline">VAT page</Link></div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Tile label="On sales" value={money(data.vat.output_vat_usd)} />
                <Tile label="Net VAT" value={money(data.vat.net_vat_usd)} note={`on purchases ${money(data.vat.input_vat_usd)}`} />
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
