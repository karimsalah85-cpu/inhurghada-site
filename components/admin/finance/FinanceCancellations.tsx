"use client";

import { useEffect, useState } from "react";
import { formatMoney, fromMinor, toMinor } from "@/lib/finance/money";

type Amount = string | number | null;
type Row = {
  month: string; reason: string; bookings: number; lost_sales_usd: Amount; retained_usd: Amount; refunds_usd: Amount;
  partner_fees_usd: Amount; payment_fees_usd: Amount; net_cost_usd: Amount; lines_missing_fx: number;
};
const reasonLabels: Record<string, string> = { weather: "Weather", guest: "Guest", partner: "Partner", other: "Other", unspecified: "No reason recorded" };
const cents = (value: Amount) => (value === null || value === undefined ? 0n : toMinor(value));
const usd = (value: bigint) => formatMoney(fromMinor(value), "USD");
const monthLabel = (month: string) => new Date(`${month}T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

export default function FinanceCancellations() {
  const year = new Date().getFullYear();
  const [from, setFrom] = useState(`${year}-01-01`);
  const [to, setTo] = useState(`${year}-12-31`);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/finance/cancellations?${new URLSearchParams({ from, to })}`, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Could not load cancellations.");
        setError(""); setRows(body.rows);
      })
      .catch((reason: Error) => setError(reason.message));
  }, [from, to]);

  const months = new Map<string, Row[]>();
  for (const row of rows ?? []) months.set(row.month, [...(months.get(row.month) ?? []), row]);
  const total = (field: keyof Row, list: Row[] = rows ?? []) => list.reduce((sum, row) => sum + cents(row[field] as Amount), 0n);
  const missingFx = (rows ?? []).reduce((sum, row) => sum + Number(row.lines_missing_fx || 0), 0);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <label className="text-sm font-semibold">From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-base font-normal sm:text-sm" /></label>
        <label className="text-sm font-semibold">To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-base font-normal sm:text-sm" /></label>
      </div>
      {error ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {!rows ? <p role="status" className="mt-4 text-sm">{error ? "" : "Loading…"}</p> : rows.length ? (
        <>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([["Cancelled bookings", String(rows.reduce((sum, row) => sum + Number(row.bookings), 0))], ["Sales lost", usd(total("lost_sales_usd"))],
              ["Revenue kept", usd(total("retained_usd"))], ["Net cost", usd(total("net_cost_usd"))]] as const).map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4"><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 text-xl font-black">{value}</dd></div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-slate-500">Sales lost = net trip price not kept. Net cost = partner cancellation fees + payment fees − revenue kept (negative means kept deposits covered the costs).{missingFx ? ` ${missingFx} trip(s) are missing an exchange rate and are not in the USD totals yet.` : ""}</p>
          <div className="mt-5 space-y-4">
            {[...months].map(([month, list]) => (
              <section key={month} className="rounded-2xl border border-slate-200 bg-white p-4">
                <h2 className="flex flex-wrap items-baseline justify-between gap-2 font-black">{monthLabel(month)}<span className="text-sm font-semibold text-slate-600">Net cost {usd(total("net_cost_usd", list))}</span></h2>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead><tr className="border-b text-left text-xs text-slate-500"><th className="py-2">Reason</th><th>Bookings</th><th>Sales lost</th><th>Kept</th><th>Refunds</th><th>Partner fees</th><th>Net cost</th></tr></thead>
                    <tbody>
                      {list.map((row) => (
                        <tr key={row.reason} className="border-b last:border-0">
                          <td className="py-2 font-semibold">{reasonLabels[row.reason] ?? row.reason}</td>
                          <td>{row.bookings}</td><td>{usd(cents(row.lost_sales_usd))}</td><td>{usd(cents(row.retained_usd))}</td>
                          <td>{usd(cents(row.refunds_usd))}</td><td>{usd(cents(row.partner_fees_usd))}</td>
                          <td className={cents(row.net_cost_usd) > 0n ? "font-bold text-rose-700" : "font-bold text-emerald-700"}>{usd(cents(row.net_cost_usd))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        </>
      ) : <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No cancellations in this period.</p>}
    </div>
  );
}
