"use client";

import { useEffect, useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import type { GoogleAdsReport } from "@/lib/google-ads";

const isoDate = (date: Date) => date.toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
const initialTo = () => isoDate(new Date());
const initialFrom = () => { const date = new Date(); date.setDate(date.getDate() - 29); return isoDate(date); };

type ReportResponse = GoogleAdsReport | { configured: false; missing: string[] };

export default function GoogleAdsPanel() {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/google-ads?from=${from}&to=${to}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load Google Ads statistics.");
      setReport(data);
      setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load Google Ads statistics."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const configured = report?.configured === true;
  const currency = configured ? report.currency : "USD";
  const money = (value: number) => new Intl.NumberFormat("en", { style: "currency", currency }).format(value);

  return <section id="google-ads" className="mt-8 scroll-mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div className="flex items-start gap-3"><BarChart3 className="mt-1 text-blue-700"/><div><h2 className="text-2xl font-bold">Google Ads</h2><p className="mt-1 text-sm text-slate-500">Live campaign statistics from the Google Ads API.</p></div></div><div className="flex flex-wrap items-end gap-2"><label className="text-xs font-bold text-slate-500">From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"/></label><label className="text-xs font-bold text-slate-500">To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"/></label><button type="button" onClick={load} disabled={loading || from > to} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""}/>{loading ? "Updating…" : "Refresh"}</button></div></div>
    {loading ? <p role="status" className="mt-4 text-sm font-semibold text-blue-700">Updating Google Ads data. The previous result will remain visible.</p> : null}
    {error ? <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</p> : null}
    {!loading && report?.configured === false ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><p className="font-black">Google Ads API setup required</p><p className="mt-2 leading-6">Add the server-only Google Ads credentials in Vercel, grant the service account access to your Ads account, then redeploy. Missing settings: <code className="font-mono">{report.missing.join(", ")}</code>.</p></div> : null}
    {configured ? <><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7"><AdMetric label="Spend" value={money(report.totals.cost)}/><AdMetric label="Impressions" value={report.totals.impressions.toLocaleString()}/><AdMetric label="Clicks" value={report.totals.clicks.toLocaleString()}/><AdMetric label="CTR" value={`${(report.totals.impressions ? report.totals.clicks / report.totals.impressions * 100 : 0).toFixed(2)}%`}/><AdMetric label="Conversions" value={report.totals.conversions.toFixed(2)}/><AdMetric label="Cost / conversion" value={money(report.totals.conversions ? report.totals.cost / report.totals.conversions : 0)}/><AdMetric label="Google Ads ROAS" value={`${(report.totals.cost ? report.totals.conversionValue / report.totals.cost : 0).toFixed(2)}×`}/></div><div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["Campaign", "Status", "Impressions", "Clicks", "Spend", "Conversions", "CPA", "ROAS"].map((label) => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{report.campaigns.map((campaign) => <tr key={campaign.id}><td className="p-3 font-bold text-slate-900">{campaign.name}</td><td className="p-3 text-xs font-semibold">{campaign.status}</td><td className="p-3">{campaign.impressions.toLocaleString()}</td><td className="p-3">{campaign.clicks.toLocaleString()}</td><td className="p-3 font-semibold">{money(campaign.cost)}</td><td className="p-3">{campaign.conversions.toFixed(2)}</td><td className="p-3">{money(campaign.conversions ? campaign.cost / campaign.conversions : 0)}</td><td className="p-3">{(campaign.cost ? campaign.conversionValue / campaign.cost : 0).toFixed(2)}×</td></tr>)}</tbody></table>{!report.campaigns.length ? <p className="p-8 text-center text-slate-500">No campaign activity in this date range.</p> : null}</div></> : null}
  </section>;
}

function AdMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><p className="text-xs font-bold text-blue-700">{label}</p><p className="mt-2 text-xl font-black text-slate-950">{value}</p></div>;
}
