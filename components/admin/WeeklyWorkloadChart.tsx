"use client";
import { useState } from "react";
import Link from "next/link";
import TrendChart from "@/components/admin/TrendChart";

type Day = { date: string; departures: number; guests: number; missing: number };
const dateLabel = (date: string) => new Intl.DateTimeFormat("en", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));

export default function WeeklyWorkloadChart({ days, canDispatch }: { days: Day[]; canDispatch: boolean }) {
  const [metric, setMetric] = useState<"departures" | "guests">("departures");
  return <section aria-labelledby="workload-chart-heading" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="workload-chart-heading" className="text-lg font-black">Statistics · next 7 days</h2><p className="mt-1 text-sm text-slate-500">Scheduled trip legs by service date, including days with no departures.</p></div><div role="group" aria-label="Workload graph metric" className="flex gap-2">{(["departures", "guests"] as const).map((value) => <button type="button" key={value} aria-pressed={metric === value} onClick={() => setMetric(value)} className={`min-h-11 rounded-lg px-3 text-sm font-bold capitalize ${metric === value ? "bg-cyan-800 text-white" : "bg-slate-100 text-slate-700"}`}>{value}</button>)}</div></div>
    <div className="mt-4 overflow-x-auto"><div className="min-w-[560px]"><TrendChart data={days.map((day) => ({ date: day.date, value: day[metric] }))} label={metric === "guests" ? "Guest places" : "Departures"} formatDate={dateLabel} /></div></div>
    <p className="mt-2 text-xs text-slate-500 sm:hidden">Scroll the graph to view all seven days.</p>
    {days.some((day) => day.missing) ? <p className="mt-2 text-xs text-amber-800">Guest totals exclude missing traveler counts; these are shown as a minimum below.</p> : null}
    <details className="mt-3 text-sm"><summary className="min-h-11 cursor-pointer py-3 font-bold text-cyan-800">Daily figures{canDispatch ? " & pickup manifests" : ""}</summary><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="py-3">Date</th><th className="px-2">Departures</th><th className="px-2">Guest places</th></tr></thead><tbody>{days.map((day) => <tr key={day.date} className="border-b border-slate-100"><td className="py-3">{canDispatch ? <Link href={`/admin/operations/manifest?date=${day.date}`} className="inline-flex min-h-11 items-center font-bold text-cyan-800 underline">{dateLabel(day.date)}</Link> : dateLabel(day.date)}</td><td className="px-2 tabular-nums">{day.departures}</td><td className="px-2 tabular-nums">{day.guests}{day.missing ? "+" : ""}</td></tr>)}</tbody></table></div></details>
  </section>;
}
