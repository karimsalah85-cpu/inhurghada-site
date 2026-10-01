"use client";

import { useMemo, useState } from "react";
import { CalendarRange, CloudRain, RotateCcw, Users } from "lucide-react";
import { SEA_CATEGORIES, type BulkAvailabilityAction } from "@/lib/availability-bulk";

type TourOption = { slug: string; title: string; category: string; destination: string };
type Result = { preview?: boolean; updated: number; created: number; stillClosed?: number; unknownMultiTrip?: string[]; overbookedCount: number; overbooked: Array<{ tour_slug: string; service_date: string; reserved: number; capacity: number }> };

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
const addDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

export default function AvailabilityBulkEditor({ tours }: { tours: TourOption[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(addDays(today(), 90));
  const [weekdays, setWeekdays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [action, setAction] = useState<BulkAvailabilityAction>("capacity");
  const [capacity, setCapacity] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [previewedFor, setPreviewedFor] = useState("");
  // Apply only what was previewed: any change to the form after Preview needs a new preview.
  const signature = JSON.stringify({ tours: [...selected].sort(), from, to, weekdays, action, capacity, note });
  const previewCurrent = Boolean(result?.preview) && previewedFor === signature;

  const grouped = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const groups = new Map<string, TourOption[]>();
    for (const tour of tours) {
      if (needle && !`${tour.title} ${tour.category} ${tour.destination}`.toLowerCase().includes(needle)) continue;
      groups.set(tour.category, [...(groups.get(tour.category) || []), tour]);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [tours, filter]);

  const toggle = (slugs: string[], on: boolean) => setSelected((current) => {
    const next = new Set(current);
    for (const slug of slugs) if (on) next.add(slug); else next.delete(slug);
    return next;
  });

  async function submit(preview: boolean) {
    setBusy(true); setError(""); if (!preview) setResult(null);
    try {
      const response = await fetch(`/api/admin/availability/bulk${preview ? "?preview=1" : ""}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tourSlugs: [...selected], from, to, weekdays, action, capacity, note }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not update availability.");
      setResult(body);
      setPreviewedFor(preview ? signature : "");
      if (!preview) window.dispatchEvent(new Event("drs-availability-changed"));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update availability."); }
    finally { setBusy(false); }
  }

  const actionButton = (value: BulkAvailabilityAction, label: string, icon: React.ReactNode) => <button type="button" onClick={() => { setAction(value); setResult(null); }} aria-pressed={action === value} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold ${action === value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"}`}>{icon}{label}</button>;

  return <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
    <div className="flex items-start gap-3"><CalendarRange className="mt-1 text-cyan-700" size={24} aria-hidden="true"/><div><h2 className="text-2xl font-bold">Set many dates at once</h2><p className="mt-1 text-sm text-slate-500">Give tours a seat limit for a season, or close departures for weather. Bookings already taken are counted against the new limit.</p></div></div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter tours…" aria-label="Filter tours" className="min-w-0 flex-1 rounded-xl border border-slate-200 p-2.5 text-sm"/>
          <button type="button" onClick={() => toggle(tours.filter((tour) => SEA_CATEGORIES.includes(tour.category)).map((tour) => tour.slug), true)} className="rounded-xl bg-cyan-50 px-3 py-2.5 text-sm font-bold text-cyan-800">All sea trips</button>
          <button type="button" onClick={() => setSelected(new Set())} className="rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-bold text-slate-700">Clear</button>
        </div>
        <p className="mt-2 text-xs font-bold text-slate-500">{selected.size} tour{selected.size === 1 ? "" : "s"} selected</p>
        <div className="mt-2 max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 p-3">{grouped.map(([category, list]) => {
          const allOn = list.every((tour) => selected.has(tour.slug));
          return <fieldset key={category}>
            <legend className="flex w-full items-center justify-between text-xs font-black uppercase tracking-wide text-slate-500"><span>{category}</span><button type="button" onClick={() => toggle(list.map((tour) => tour.slug), !allOn)} className="normal-case tracking-normal text-cyan-700">{allOn ? "None" : "All"}</button></legend>
            <div className="mt-1 grid gap-1 sm:grid-cols-2">{list.map((tour) => <label key={tour.slug} className="flex items-start gap-2 rounded-lg p-1.5 text-sm hover:bg-slate-50"><input type="checkbox" checked={selected.has(tour.slug)} onChange={(event) => toggle([tour.slug], event.target.checked)} className="mt-1"/><span>{tour.title}<span className="block text-xs text-slate-400">{tour.destination}</span></span></label>)}</div>
          </fieldset>;
        })}{!grouped.length ? <p className="p-3 text-sm text-slate-500">No tours match.</p> : null}</div>
      </div>
      <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
        <div className="flex flex-wrap gap-2">{actionButton("capacity", "Set seats", <Users size={16}/>)}{actionButton("close", "Close dates", <CloudRain size={16}/>)}{actionButton("reopen", "Reopen", <RotateCcw size={16}/>)}</div>
        {action === "capacity" ? <label className="block text-sm font-semibold">Seats per departure<input type="number" min={0} max={10000} value={capacity} onChange={(event) => setCapacity(event.target.value)} placeholder="Empty = unlimited" className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal"/></label> : null}
        <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-semibold">From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal"/></label><label className="block text-sm font-semibold">To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal"/></label></div>
        <fieldset><legend className="text-sm font-semibold">On these days</legend><div className="mt-1 flex flex-wrap gap-1">{weekdayLabels.map((label, day) => <button key={label} type="button" aria-pressed={weekdays.includes(day)} onClick={() => setWeekdays((current) => current.includes(day) ? current.filter((value) => value !== day) : [...current, day].sort())} className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${weekdays.includes(day) ? "bg-cyan-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>{label}</button>)}</div></fieldset>
        <label className="block text-sm font-semibold">Note (optional)<input value={note} onChange={(event) => setNote(event.target.value)} maxLength={200} placeholder={action === "close" ? "e.g. Port closed — high winds" : "e.g. Summer season boat"} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal"/></label>
        {error ? <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800">{error}</p> : null}
        {result && (!result.preview || previewCurrent) ? <div role="status" className={`rounded-xl p-3 text-sm ${result.preview ? "bg-cyan-50 text-cyan-950" : "bg-emerald-50 text-emerald-900"}`}>
          <p className="font-bold">{result.preview ? "This will change" : "Done:"} {result.updated} existing date{result.updated === 1 ? "" : "s"} and add {result.created} new.</p>
          {result.stillClosed ? <p className="mt-2 text-xs">{result.stillClosed} closed date{result.stillClosed === 1 ? " stays" : "s stay"} closed. Use Reopen to open {result.stillClosed === 1 ? "it" : "them"}.</p> : null}
          {result.unknownMultiTrip?.length ? <p className="mt-2 text-xs font-semibold text-amber-800">Could not read the trips in multi-trip booking{result.unknownMultiTrip.length === 1 ? "" : "s"} {result.unknownMultiTrip.join(", ")} — their guests are not counted. Check those dates by hand.</p> : null}
          {result.overbookedCount ? <p className="mt-2 font-semibold text-amber-800">{result.overbookedCount} date{result.overbookedCount === 1 ? " already has" : "s already have"} more guests than {capacity || 0} seats — no bookings are cancelled, but no new ones will be accepted there. {result.overbooked.slice(0, 5).map((row) => `${row.tour_slug} ${row.service_date} (${row.reserved})`).join(", ")}{result.overbookedCount > 5 ? "…" : ""}</p> : null}
        </div> : null}
        <div className="flex gap-2"><button type="button" disabled={busy || !selected.size} onClick={() => void submit(true)} className="flex-1 rounded-xl border border-slate-300 bg-white p-3 text-sm font-bold text-slate-800 disabled:opacity-50">Preview</button><button type="button" disabled={busy || !selected.size || !previewCurrent} onClick={() => void submit(false)} className="flex-1 rounded-xl bg-cyan-700 p-3 text-sm font-bold text-white disabled:opacity-50" title={!previewCurrent ? "Preview first" : undefined}>{busy ? "Working…" : "Apply"}</button></div>
      </div>
    </div>
  </section>;
}
