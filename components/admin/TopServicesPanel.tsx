"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus, Trophy } from "lucide-react";
import type { TopService } from "@/lib/admin-analytics";

type Report = { range: number; currentFrom: string; currentTo: string; services: TopService[] };

export default function TopServicesPanel({ range }: { range: 7 | 30 | 90 }) {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { void fetch(`/api/admin/top-services?range=${range}`, { cache: "no-store" }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setReport(data); }).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load rankings.")); }, [range]);
  return <section className="mt-8 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex gap-3"><Trophy className="mt-1 text-amber-600"/><div><h2 className="text-2xl font-bold">Top services</h2><p className="mt-1 text-sm text-slate-500">Upcoming confirmed bookings by service date.</p></div></div><div className="flex rounded-xl border bg-slate-50 p-1">{([7,30,90] as const).map(days=><a key={days} href={`/admin?range=${days}#analytics`} className={`rounded-lg px-3 py-2 text-xs font-black ${range===days?"bg-slate-900 text-white":"text-slate-600"}`}>{days} days</a>)}</div></div>
    {error?<p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</p>:null}
    {!report&&!error?<p className="mt-5 text-sm text-slate-500">Loading active booking rankings…</p>:null}
    {report?<div className="mt-6 overflow-hidden rounded-2xl border"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Rank</th><th className="p-3">Service</th><th className="p-3">Bookings</th><th className="p-3">Trend</th></tr></thead><tbody>{report.services.map((item,index)=><tr key={item.service} className="border-t"><td className="p-3 font-black">{index+1}</td><td className="p-3 font-bold">{item.service}</td><td className="p-3">{item.bookings}</td><td className="p-3"><Trend item={item}/></td></tr>)}</tbody></table>{!report.services.length?<p className="p-8 text-center text-sm text-slate-500">No upcoming confirmed bookings in this window.</p>:null}</div>:null}
  </section>;
}

function Trend({item}:{item:TopService}) { if(item.trend===null)return <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500"><Minus size={14}/>New</span>;const up=item.trend>0;return <span className={`inline-flex items-center gap-1 text-xs font-bold ${up?"text-emerald-700":item.trend<0?"text-rose-700":"text-slate-500"}`}>{up?<ArrowUpRight size={14}/>:item.trend<0?<ArrowDownRight size={14}/>:<Minus size={14}/>} {Math.abs(item.trend).toFixed(0)}%</span>}
