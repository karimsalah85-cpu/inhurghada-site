"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import ProfitLossChart from "@/components/admin/ProfitLossChart";
import { FinanceNotConfigured } from "@/components/admin/finance/FinanceSuppliers";
import { formatMoney } from "@/lib/finance/money";
import type { DrillRow, StatementRow, TrendPoint } from "@/lib/finance/pnl";

export type ReportOptions = { destinations: string[]; productLines: string[]; tours: { slug: string; name: string }[]; suppliers: { id: string; name: string }[] };
type Report = {
  configured: boolean; error?: string;
  previous: { from: string; to: string } | null; filters: string;
  gross: StatementRow[]; net: StatementRow[]; trend: TrendPoint[]; options: ReportOptions;
  bookings: number; pending: { lines: number; expenses: number };
};
export type ReportQueryState = { from: string; to: string; compare: boolean; destination: string; tour: string; supplier: string; product_line: string };

const monthStart = () => `${new Date().toISOString().slice(0, 8)}01`;
const today = () => new Date().toISOString().slice(0, 10);
export const initialQuery = (): ReportQueryState => ({ from: monthStart(), to: today(), compare: true, destination: "", tour: "", supplier: "", product_line: "" });
export const queryString = (query: ReportQueryState, extra: Record<string, string> = {}) =>
  new URLSearchParams(Object.entries({ ...query, compare: query.compare ? "1" : "0", ...extra }).filter(([, value]) => value !== "") as [string, string][]).toString();

const label = (value: string) => value.replace(/[-_]/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());

function formatRow(row: StatementRow, value: string | null) {
  if (value === null) return "—";
  if (row.kind === "percent") return `${value}%`;
  return row.kind === "cost" && value !== "0.00" ? `−${formatMoney(value.replace(/^-/, ""))}` : formatMoney(value);
}
function formatChange(row: StatementRow) {
  if (row.change === null) return "—";
  const negative = row.change.startsWith("-");
  const magnitude = row.change.replace(/^-/, "");
  if (row.kind === "percent") return `${negative ? "−" : "+"}${magnitude} pp`;
  return `${negative ? "−" : "+"}${formatMoney(magnitude)}`;
}
/** Green when the change helps profit: up for revenue/subtotals, down for costs. */
function changeTone(row: StatementRow) {
  if (!row.change || row.change === "0.00") return "text-slate-500";
  const up = !row.change.startsWith("-");
  return (row.kind === "cost" ? !up : up) ? "text-emerald-700" : "text-rose-700";
}

export function ReportFilters({ query, onChange, options, children }: { query: ReportQueryState; onChange: (next: ReportQueryState) => void; options?: ReportOptions; children?: React.ReactNode }) {
  const field = "mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-normal";
  const set = (key: keyof ReportQueryState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...query, [key]: event.target.type === "checkbox" ? (event.target as HTMLInputElement).checked : event.target.value });
  return <div className="grid gap-3 rounded-3xl bg-white p-5 text-sm shadow-sm sm:grid-cols-4 lg:grid-cols-8">
    <label className="font-semibold">From<input type="date" value={query.from} max={query.to} onChange={set("from")} className={field} /></label>
    <label className="font-semibold">To<input type="date" value={query.to} min={query.from} onChange={set("to")} className={field} /></label>
    <label className="font-semibold">Destination<select value={query.destination} onChange={set("destination")} className={field}><option value="">All</option>{options?.destinations.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>
    <label className="font-semibold">Tour<select value={query.tour} onChange={set("tour")} className={field}><option value="">All</option>{options?.tours.map((tour) => <option key={tour.slug} value={tour.slug}>{tour.name}</option>)}</select></label>
    <label className="font-semibold">Supplier<select value={query.supplier} onChange={set("supplier")} className={field}><option value="">All</option>{options?.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
    <label className="font-semibold">Product line<select value={query.product_line} onChange={set("product_line")} className={field}><option value="">All</option>{options?.productLines.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>
    {children}
  </div>;
}

function StatementTable({ title, subtitle, rows, compare, onDrill, active }: { title: string; subtitle: string; rows: StatementRow[]; compare: boolean; onDrill: (row: StatementRow) => void; active: string | null }) {
  return <section className="rounded-3xl bg-white p-6 shadow-sm">
    <h2 className="text-lg font-black text-slate-950">{title}</h2>
    <p className="text-xs text-slate-500">{subtitle}</p>
    <table className="mt-4 w-full text-sm">
      <thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className="py-1 text-left">Line</th><th className="py-1 text-right">Current</th>{compare ? <><th className="py-1 text-right">Previous</th><th className="py-1 text-right">Change</th></> : null}</tr></thead>
      <tbody>
        {rows.map((row) => {
          const subtotal = row.kind === "subtotal";
          const clickable = Boolean(row.drill);
          return <tr key={row.key} onClick={clickable ? () => onDrill(row) : undefined}
            className={`${subtotal ? "border-t border-slate-200 font-black text-slate-950" : row.kind === "percent" ? "text-xs text-slate-500" : "text-slate-700"} ${clickable ? "cursor-pointer hover:bg-cyan-50" : ""} ${active === row.drill && clickable ? "bg-cyan-50" : ""}`}>
            <td className={`py-1.5 ${row.indent ? "pl-4" : ""}`}>{clickable ? <button type="button" className="text-left hover:underline" onClick={(event) => { event.stopPropagation(); onDrill(row); }}>{row.label}</button> : row.label}</td>
            <td className="py-1.5 text-right tabular-nums">{formatRow(row, row.current)}</td>
            {compare ? <><td className="py-1.5 text-right tabular-nums text-slate-500">{formatRow(row, row.previous)}</td><td className={`py-1.5 text-right tabular-nums ${changeTone(row)}`}>{formatChange(row)}</td></> : null}
          </tr>;
        })}
      </tbody>
    </table>
  </section>;
}

export default function FinancePnl() {
  const [query, setQuery] = useState<ReportQueryState>(initialQuery);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [drill, setDrill] = useState<{ key: string; label: string; rows?: DrillRow[]; total?: number; truncated?: boolean; error?: string } | null>(null);

  const load = useCallback(async (next: ReportQueryState) => {
    setError("");
    const response = await fetch(`/api/admin/finance/pnl?${queryString(next)}`, { cache: "no-store" });
    const payload = await response.json() as Report;
    if (!response.ok && payload.configured !== false) throw new Error(payload.error || "Could not load the P&L.");
    setReport(payload);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void load(query).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load the P&L.")); }, 250);
    return () => window.clearTimeout(timeout);
  }, [load, query]);

  async function openDrill(row: StatementRow) {
    if (!row.drill) return;
    setDrill({ key: row.drill, label: row.label });
    const response = await fetch(`/api/admin/finance/pnl/drilldown?${queryString(query, { key: row.drill, compare: "0" })}`, { cache: "no-store" });
    const payload = await response.json();
    setDrill(response.ok ? { key: row.drill, label: row.label, ...payload } : { key: row.drill, label: row.label, error: payload.error || "Could not load the detail." });
  }

  const chartRows = useMemo(() => (report?.trend || []).map((point) => ({
    month: point.month, revenue: Number(point.net_sales), costs: Number(point.costs), profit: Number(point.net_profit),
  })), [report]);

  if (report?.configured === false) return <FinanceNotConfigured message={report.error} />;
  const compare = Boolean(report?.previous);

  return <div className="space-y-6">
    <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"><strong>Management reporting, not a statutory accounting statement.</strong> All figures in USD, accrual basis: trip revenue and trip costs on the trip date, operating expenses on the invoice date, voided expenses excluded.</p>
    <ReportFilters query={query} onChange={setQuery} options={report?.options}>
      <label className="flex items-end gap-2 pb-2 font-semibold"><input type="checkbox" checked={query.compare} onChange={(event) => setQuery({ ...query, compare: event.target.checked })} /> Compare to previous period</label>
      <div className="flex items-end"><a href={`/api/admin/finance/pnl?${queryString(query, { format: "csv" })}`} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-center font-bold text-slate-800">Export CSV</a></div>
    </ReportFilters>

    {error ? <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p> : null}
    {!report ? <p className="text-sm text-slate-500">Loading P&amp;L…</p> : <>
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">{report.bookings} bookings in period</span>
        {report.previous ? <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">Compared with {report.previous.from} → {report.previous.to}</span> : null}
        {report.pending.lines || report.pending.expenses ? <span role="status" className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-900 ring-1 ring-amber-200">Not included until their USD rate is final: {report.pending.lines} booking lines, {report.pending.expenses} expenses</span> : null}
        {report.filters ? <span className="rounded-full bg-cyan-50 px-3 py-1 font-semibold text-cyan-900">Filters apply to trips only ({report.filters}); operating expenses are company-wide</span> : null}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <StatementTable title="Gross view" subtitle="Everything guests paid, then what it cost to deliver." rows={report.gross} compare={compare} onDrill={openDrill} active={drill?.key ?? null} />
        <StatementTable title="Net revenue view" subtitle="Only what Daily Red Sea earns over the supplier cost." rows={report.net} compare={compare} onDrill={openDrill} active={drill?.key ?? null} />
      </div>

      {drill ? <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between"><h2 className="text-lg font-black">{drill.label}</h2><button type="button" onClick={() => setDrill(null)} className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-bold">Close</button></div>
        {drill.error ? <p role="alert" className="mt-3 text-sm text-rose-700">{drill.error}</p> : !drill.rows ? <p className="mt-3 text-sm text-slate-500">Loading…</p> : <DrillTable rows={drill.rows} total={drill.total ?? 0} truncated={Boolean(drill.truncated)} />}
      </section> : null}

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black">Monthly trend</h2>
        <p className="text-xs text-slate-500">Net sales against all costs (trip, selling and operating); the label above each month is net profit.</p>
        <div className="mt-3"><ProfitLossChart rows={chartRows} labels={{ revenue: "Net sales", costs: "All costs", profit: "Net profit" }} formatValue={(value) => formatMoney(value.toFixed(2)).replace(/\.00$/, "")} /></div>
      </section>
    </>}
  </div>;
}

function DrillTable({ rows, total, truncated }: { rows: DrillRow[]; total: number; truncated: boolean }) {
  if (!rows.length) return <p className="mt-3 text-sm text-slate-500">Nothing behind this line in the selected period.</p>;
  return <div className="mt-3 overflow-x-auto">
    {truncated ? <p className="mb-2 text-xs text-amber-700">Showing the largest {rows.length} of {total}. Narrow the date range or filters to see the rest.</p> : null}
    <table className="w-full min-w-[720px] text-left text-sm">
      {rows[0].kind === "line" ? <>
        <thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className="py-1 pr-3">Trip date</th><th className="py-1 pr-3">Booking</th><th className="py-1 pr-3">Tour</th><th className="py-1 pr-3">Supplier</th><th className="py-1 pr-3">Outcome</th><th className="py-1 text-right">USD</th></tr></thead>
        <tbody>{rows.map((row) => row.kind === "line" ? <tr key={row.line.line_id} className="border-t border-slate-100"><td className="py-1.5 pr-3 tabular-nums">{row.line.trip_date}</td><td className="py-1.5 pr-3 font-semibold">{row.line.reference}</td><td className="py-1.5 pr-3">{row.line.tour_name || "—"}</td><td className="py-1.5 pr-3">{row.line.supplier_id ? <a className="text-cyan-700 hover:underline" href={`/admin/finance/suppliers/${row.line.supplier_id}`}>{row.line.supplier_name}</a> : "—"}</td><td className="py-1.5 pr-3 capitalize">{row.line.outcome.replace("_", " ")}</td><td className="py-1.5 text-right tabular-nums">{formatMoney(row.amount)}</td></tr> : null)}</tbody>
      </> : <>
        <thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className="py-1 pr-3">Invoice date</th><th className="py-1 pr-3">Description</th><th className="py-1 pr-3">Vendor</th><th className="py-1 pr-3">Source</th><th className="py-1 pr-3 text-right">Original</th><th className="py-1 text-right">USD</th></tr></thead>
        <tbody>{rows.map((row) => row.kind === "expense" ? <tr key={row.expense.id} className="border-t border-slate-100"><td className="py-1.5 pr-3 tabular-nums">{row.expense.expense_date}</td><td className="py-1.5 pr-3">{row.expense.description}</td><td className="py-1.5 pr-3">{row.expense.vendor || "—"}</td><td className="py-1.5 pr-3 capitalize">{row.expense.source.replace("_", " ")}</td><td className="py-1.5 pr-3 text-right tabular-nums">{row.expense.amount} {row.expense.currency}</td><td className="py-1.5 text-right tabular-nums">{formatMoney(row.amount)}</td></tr> : null)}</tbody>
      </>}
    </table>
  </div>;
}
