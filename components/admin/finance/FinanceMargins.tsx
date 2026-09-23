"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FinanceNotConfigured } from "@/components/admin/finance/FinanceSuppliers";
import { initialQuery, queryString, ReportFilters, type ReportOptions, type ReportQueryState } from "@/components/admin/finance/FinancePnl";
import { formatMoney } from "@/lib/finance/money";
import type { MarginGroup, MarginRow } from "@/lib/finance/pnl";

type Payload = { configured: boolean; error?: string; threshold: string; rows: MarginRow[]; pending: number; options: ReportOptions };
const groups: { key: MarginGroup; label: string }[] = [
  { key: "booking", label: "Per booking" }, { key: "tour", label: "Per tour" }, { key: "supplier", label: "Per supplier" }, { key: "destination", label: "Per destination" },
];

export default function FinanceMargins() {
  const [query, setQuery] = useState<ReportQueryState>(() => ({ ...initialQuery(), compare: false }));
  const [group, setGroup] = useState<MarginGroup>("booking");
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`/api/admin/finance/margins?${queryString(query, { group, compare: "0" })}`, { cache: "no-store" });
    const payload = await response.json() as Payload;
    if (!response.ok && payload.configured !== false) throw new Error(payload.error || "Could not load margins.");
    setData(payload);
  }, [group, query]);

  useEffect(() => {
    const timeout = window.setTimeout(() => { setError(""); void load().catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load margins.")); }, 250);
    return () => window.clearTimeout(timeout);
  }, [load]);

  async function saveThreshold(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setNotice("");
    const value = String(new FormData(event.currentTarget).get("threshold") || "");
    const response = await fetch("/api/admin/finance/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ margin_threshold_pct: value }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setError(payload.error || "Could not save the threshold."); return; }
    setNotice(`Margins below ${payload.margin_threshold_pct}% are now flagged.`);
    await load().catch(() => undefined);
  }

  if (data?.configured === false) return <FinanceNotConfigured message={data.error} />;
  const rows = (data?.rows || []).filter((row) => !onlyFlagged || row.flag);
  const flagged = (data?.rows || []).filter((row) => row.flag).length;

  return <div className="space-y-6">
    <ReportFilters query={query} onChange={setQuery} options={data?.options}>
      <label className="flex items-end gap-2 pb-2 font-semibold"><input type="checkbox" checked={onlyFlagged} onChange={(event) => setOnlyFlagged(event.target.checked)} /> Flagged only</label>
      <div className="flex items-end"><a href={`/api/admin/finance/margins?${queryString(query, { group, compare: "0", format: "csv" })}`} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-center font-bold text-slate-800">Export CSV</a></div>
    </ReportFilters>

    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div role="tablist" aria-label="Group margins" className="flex flex-wrap gap-2">
          {groups.map((item) => <button key={item.key} type="button" role="tab" aria-selected={group === item.key} onClick={() => setGroup(item.key)}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${group === item.key ? "bg-slate-950 text-white" : "border border-slate-300 text-slate-700"}`}>{item.label}</button>)}
        </div>
        {data ? <form onSubmit={saveThreshold} className="flex items-end gap-2 text-sm">
          <label className="font-semibold">Flag margins below (%)<input key={data.threshold} name="threshold" defaultValue={data.threshold} inputMode="decimal" pattern="\d{1,3}(\.\d{1,2})?" className="mt-1 block w-28 rounded-xl border border-slate-200 px-3 py-2" /></label>
          <button className="rounded-xl border border-slate-300 px-3 py-2 font-bold">Save</button>
        </form> : null}
      </div>
      {error ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {notice ? <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p> : null}
      <p className="mt-4 text-xs text-slate-500">Margin = net sales − supplier cost − agent commission − payment fees, in USD at each trip-date rate. Worst first. {flagged} flagged{data?.pending ? ` · ${data.pending} booking lines not included until their USD rate is final` : ""}.</p>
      {!data ? <p className="mt-4 text-sm text-slate-500">Loading margins…</p> : <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className="py-2 pr-3">{groups.find((item) => item.key === group)?.label.replace("Per ", "")}</th><th className="py-2 pr-3 text-right">Bookings</th><th className="py-2 pr-3 text-right">Net sales</th><th className="py-2 pr-3 text-right">Margin</th><th className="py-2 pr-3 text-right">Margin %</th><th className="py-2">Flag</th></tr></thead>
          <tbody>
            {rows.map((row) => <tr key={row.key} className="border-t border-slate-100">
              <td className="py-2 pr-3 font-semibold text-slate-900">{group === "supplier" && row.key !== "none" ? <a href={`/admin/finance/suppliers/${row.key}`} className="hover:text-cyan-700 hover:underline">{row.label}</a> : row.label}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{row.bookings}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{formatMoney(row.net_sales)}</td>
              <td className={`py-2 pr-3 text-right tabular-nums ${row.flag === "negative" ? "font-bold text-rose-700" : ""}`}>{formatMoney(row.margin)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{row.margin_pct === null ? "—" : `${row.margin_pct}%`}</td>
              <td className="py-2">{row.flag === "negative" ? <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-800 ring-1 ring-rose-200">▼ Negative margin</span>
                : row.flag === "below_threshold" ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-200">! Below {data.threshold}%</span> : null}</td>
            </tr>)}
            {!rows.length ? <tr><td colSpan={6} className="py-6 text-center text-slate-500">{onlyFlagged ? "Nothing flagged in this period." : "No bookings in this period."}</td></tr> : null}
          </tbody>
        </table>
      </div>}
    </section>
  </div>;
}
