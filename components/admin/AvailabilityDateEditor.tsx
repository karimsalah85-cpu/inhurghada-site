"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Lock, LockOpen, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { availabilityState, type AvailabilityState } from "@/lib/availability-record";

type TourOption = { slug: string; title: string; category: string; destination: string; currency: string; datePrice: boolean };
type AvailabilityRecord = {
  id: string;
  tour_slug: string;
  service_date: string;
  start_time: string | null;
  capacity: number | null;
  reserved: number;
  blocked: boolean;
  price_override: number | string | null;
  currency: string;
  notes: string | null;
};
type Form = { tour_slug: string; service_date: string; start_time: string; capacity: string; blocked: boolean; price_override: string; notes: string };
type StateFilter = "all" | "closed" | "limited" | "full";

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
const addDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
const longDate = (date: string) => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
const emptyForm = (tour = ""): Form => ({ tour_slug: tour, service_date: "", start_time: "", capacity: "", blocked: false, price_override: "", notes: "" });

const stateLabel: Record<AvailabilityState, string> = { closed: "Closed", overbooked: "Overbooked", full: "Full", limited: "Few left", open: "Open" };
const stateStyle: Record<AvailabilityState, string> = {
  closed: "bg-slate-200 text-slate-800",
  overbooked: "bg-rose-100 text-rose-800",
  full: "bg-amber-100 text-amber-900",
  limited: "bg-amber-50 text-amber-800",
  open: "bg-emerald-50 text-emerald-800",
};
const inputClass = "mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

export default function AvailabilityDateEditor({ tours }: { tours: TourOption[] }) {
  const [tour, setTour] = useState("");
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(addDays(today(), 30));
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [records, setRecords] = useState<AvailabilityRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [migration, setMigration] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<Form>(emptyForm());
  const [editing, setEditing] = useState<AvailabilityRecord | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const request = useRef(0);

  const titles = useMemo(() => new Map(tours.map((option) => [option.slug, option.title])), [tours]);
  const titleOf = useCallback((slug: string) => titles.get(slug) || slug, [titles]);
  const formTour = tours.find((option) => option.slug === form.tour_slug);
  // Trips sold by boat, package or group size have no single price to replace.
  const priceApplies = formTour?.datePrice !== false;
  const rangeValid = Boolean(from && to && from <= to);

  const load = useCallback(async () => {
    if (!rangeValid) return;
    const current = ++request.current;
    setLoading(true); setError("");
    try {
      const query = new URLSearchParams({ from, to });
      if (tour) query.set("tour", tour);
      const response = await fetch(`/api/admin/availability?${query}`, { cache: "no-store" });
      const body = await response.json();
      if (current !== request.current) return; // a newer filter change is already loading
      if (!response.ok) throw new Error(body.error || "Could not load availability.");
      if (body.configured === false) { setMigration(body.migration); setRecords([]); setTotal(0); return; }
      setMigration(""); setRecords(body.records); setTotal(body.total);
    } catch (reason) {
      if (current === request.current) setError(reason instanceof Error ? reason.message : "Could not load availability.");
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [from, to, tour, rangeValid]);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void load(); }, 0);
    const reload = () => { void load(); };
    window.addEventListener("drs-availability-changed", reload);
    return () => { window.clearTimeout(timeout); window.removeEventListener("drs-availability-changed", reload); };
  }, [load]);

  const counts = useMemo(() => {
    const tally = { closed: 0, limited: 0, full: 0 };
    for (const record of records) {
      const state = availabilityState(record);
      if (state === "closed") tally.closed += 1;
      else if (state === "limited") tally.limited += 1;
      else if (state === "full" || state === "overbooked") tally.full += 1;
    }
    return tally;
  }, [records]);

  const visible = useMemo(() => records.filter((record) => {
    if (stateFilter === "all") return true;
    const state = availabilityState(record);
    return stateFilter === "full" ? state === "full" || state === "overbooked" : state === stateFilter;
  }), [records, stateFilter]);

  const byDate = useMemo(() => {
    const groups = new Map<string, AvailabilityRecord[]>();
    for (const record of visible) groups.set(record.service_date, [...(groups.get(record.service_date) || []), record]);
    return [...groups.entries()];
  }, [visible]);

  const span = rangeValid ? daysBetween(from, to) + 1 : 31;
  const shift = (direction: 1 | -1) => { setFrom(addDays(from, direction * span)); setTo(addDays(to, direction * span)); };
  const set = <Key extends keyof Form>(name: Key, value: Form[Key]) => setForm((current) => ({ ...current, [name]: value }));
  const reset = () => { setEditing(null); setForm(emptyForm(tour)); };

  function startEdit(record: AvailabilityRecord) {
    setEditing(record); setError(""); setNotice("");
    setForm({
      tour_slug: record.tour_slug,
      service_date: record.service_date,
      start_time: record.start_time ? record.start_time.slice(0, 5) : "",
      capacity: record.capacity == null ? "" : String(record.capacity),
      blocked: record.blocked,
      price_override: record.price_override == null ? "" : String(record.price_override),
      notes: record.notes || "",
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function send(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown) {
    const response = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Could not save the change.");
    return result as { record?: AvailabilityRecord };
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      // A record with bookings keeps its tour, date and time, so those are not sent on edit.
      const locked = Boolean(editing && editing.reserved > 0);
      const { tour_slug, service_date, start_time, ...fields } = form;
      const rest = priceApplies ? fields : { ...fields, price_override: "" };
      const payload = locked ? rest : { tour_slug, service_date, start_time, ...rest };
      const result = editing
        ? await send(`/api/admin/control-center/availability/${encodeURIComponent(editing.id)}`, "PATCH", payload)
        : await send("/api/admin/control-center", "POST", { resource: "availability", ...payload });
      const saved = result.record;
      const label = `${titleOf(form.tour_slug)} on ${longDate(form.service_date)}`;
      const outside = form.service_date < from || form.service_date > to || (tour && tour !== form.tour_slug);
      const counted = !editing && saved && saved.reserved > 0 ? ` ${saved.reserved} place${saved.reserved === 1 ? " is" : "s are"} already booked and counted.` : "";
      setNotice(`${editing ? "Updated" : "Saved"} ${label}.${counted}${outside ? " It is outside the dates or tour shown below." : ""}`);
      reset();
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save the change."); }
    finally { setSaving(false); }
  }

  async function toggleClosed(record: AvailabilityRecord) {
    const closing = !record.blocked;
    if (closing && record.reserved > 0 && !window.confirm(`${record.reserved} place${record.reserved === 1 ? " is" : "s are"} already booked on ${titleOf(record.tour_slug)}, ${longDate(record.service_date)}. Closing stops new bookings but does not cancel or notify those guests. Close this date?`)) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await send(`/api/admin/control-center/availability/${encodeURIComponent(record.id)}`, "PATCH", { blocked: closing });
      setNotice(`${titleOf(record.tour_slug)} on ${longDate(record.service_date)} is now ${closing ? "closed" : "open"}.`);
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save the change."); }
    finally { setSaving(false); }
  }

  async function remove(record: AvailabilityRecord) {
    const consequence = record.reserved > 0
      ? `${record.reserved} place${record.reserved === 1 ? " is" : "s are"} booked on it; those bookings stay, but the date goes back to open with unlimited places.`
      : "The date goes back to open with unlimited places.";
    if (!window.confirm(`Delete the record for ${titleOf(record.tour_slug)}, ${longDate(record.service_date)}? ${consequence}`)) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await send(`/api/admin/control-center/availability/${encodeURIComponent(record.id)}`, "DELETE");
      if (editing?.id === record.id) reset();
      setNotice(`Deleted the record for ${titleOf(record.tour_slug)}, ${longDate(record.service_date)}.`);
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not delete the record."); }
    finally { setSaving(false); }
  }

  const locked = Boolean(editing && editing.reserved > 0);
  const filterButton = (value: StateFilter, label: string, count?: number) => (
    <button key={value} type="button" aria-pressed={stateFilter === value} onClick={() => setStateFilter(value)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${stateFilter === value ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
      {label}{count !== undefined ? ` · ${count}` : ""}
    </button>
  );

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-1 text-cyan-700" size={24} aria-hidden="true" />
          <div>
            <h2 className="text-2xl font-bold">Individual dates</h2>
            <p className="mt-1 text-sm text-slate-500">See what is set for each date, then edit, close or remove a single one.</p>
          </div>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-50">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden="true" />Refresh
        </button>
      </div>

      {error ? <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</p> : null}
      {notice ? <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{notice}</p> : null}
      {migration ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><p className="font-black">Database upgrade required</p><p className="mt-2">Run <code>{migration}</code> in the Supabase SQL Editor, then refresh this section.</p></div> : null}

      <div className="mt-5 grid gap-8 xl:grid-cols-[0.75fr_1.25fr]">
        <form ref={formRef} onSubmit={save} className="space-y-4 self-start rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black">{editing ? "Edit date" : "Add a date"}</h3>
            {editing ? <button type="button" onClick={reset} className="text-sm font-bold text-slate-500">Cancel</button> : null}
          </div>
          <label className="block text-sm font-semibold">Tour
            <select required disabled={locked} value={form.tour_slug} onChange={(event) => set("tour_slug", event.target.value)} className={inputClass}>
              <option value="">Choose a tour</option>
              {form.tour_slug && !titles.has(form.tour_slug) ? <option value={form.tour_slug}>{form.tour_slug}</option> : null}
              {tours.map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold">Date
              <input required disabled={locked} type="date" value={form.service_date} onChange={(event) => set("service_date", event.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm font-semibold">Start time
              <input disabled={locked} type="time" value={form.start_time} onChange={(event) => set("start_time", event.target.value)} className={inputClass} />
            </label>
          </div>
          {locked ? <p className="rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-900">{editing!.reserved} place{editing!.reserved === 1 ? " is" : "s are"} booked on this record, so its tour, date and time are fixed. Add a new record for another date.</p> : <p className="text-xs text-slate-500">Leave the start time empty to cover every departure that day.</p>}
          <label className="block text-sm font-semibold">Seats
            <input type="number" min={0} max={10000} step={1} inputMode="numeric" value={form.capacity} onChange={(event) => set("capacity", event.target.value)} placeholder="Empty = unlimited" className={inputClass} />
          </label>
          {editing && form.capacity !== "" && Number(form.capacity) < editing.reserved ? <p className="rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-900">{editing.reserved} places are already booked. No bookings are cancelled, but no new ones will be accepted.</p> : null}
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={form.blocked} onChange={(event) => set("blocked", event.target.checked)} />Close this date (no new bookings)
          </label>
          <label className="block text-sm font-semibold">Price on this date{formTour ? ` (${formTour.currency})` : ""}
            <input type="number" min={0.01} step="0.01" inputMode="decimal" disabled={!priceApplies} value={priceApplies ? form.price_override : ""} onChange={(event) => set("price_override", event.target.value)} placeholder="Empty = normal price" className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-400`} />
            <span className="mt-1 block text-xs font-normal text-slate-500">{priceApplies
              ? "Guests booking this date pay this instead of the normal adult price (or the whole-booking price on per-booking trips). Child prices change by the same percentage. Extras and transfers stay the same."
              : "This trip is priced by boat, package or group size, so it always uses its normal prices."}</span>
          </label>
          <label className="block text-sm font-semibold">Notes
            <textarea value={form.notes} maxLength={500} onChange={(event) => set("notes", event.target.value)} className={`${inputClass} min-h-20`} />
          </label>
          <button disabled={saving} className="w-full rounded-xl bg-cyan-700 py-3 font-bold text-white disabled:opacity-50">{saving ? "Saving…" : editing ? "Update date" : "Save date"}</button>
        </form>

        <div className="min-w-0">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
            <label className="block text-sm font-semibold sm:col-span-2 lg:col-span-1">Show tour
              <select value={tour} onChange={(event) => setTour(event.target.value)} className={inputClass}>
                <option value="">All tours</option>
                {tours.map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold">From
              <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm font-semibold">To
              <input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} className={inputClass} />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => shift(-1)} disabled={!rangeValid} aria-label="Earlier dates" className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft size={16} /></button>
            <button type="button" onClick={() => shift(1)} disabled={!rangeValid} aria-label="Later dates" className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronRight size={16} /></button>
            <button type="button" onClick={() => { setFrom(today()); setTo(addDays(today(), 30)); }} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">Next 30 days</button>
            <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" aria-hidden="true" />
            {filterButton("all", "All", records.length)}
            {filterButton("closed", "Closed", counts.closed)}
            {filterButton("limited", "Few left", counts.limited)}
            {filterButton("full", "Full", counts.full)}
          </div>
          {!rangeValid ? <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-900">The end date must be on or after the start date.</p> : null}
          {total > records.length ? <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-900">Showing the first {records.length} of {total} records. Choose one tour or a shorter range to see the rest.</p> : null}

          <div className="mt-4 max-h-[640px] space-y-4 overflow-y-auto pr-1">
            {byDate.map(([date, rows]) => (
              <div key={date}>
                <h4 className="sticky top-0 z-10 bg-white py-1 text-xs font-black uppercase tracking-wide text-slate-500">{longDate(date)}</h4>
                <ul className="mt-1 space-y-2">
                  {rows.map((record) => {
                    const state = availabilityState(record);
                    const percent = record.capacity ? Math.min(100, Math.round((record.reserved / record.capacity) * 100)) : 0;
                    return (
                      <li key={record.id} className={`rounded-xl border p-3 ${editing?.id === record.id ? "border-cyan-400 bg-cyan-50/40" : "border-slate-200"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-900">{titleOf(record.tour_slug)}</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {record.start_time ? record.start_time.slice(0, 5) : "Whole day"}
                              {" · "}
                              {record.capacity == null ? `${record.reserved} booked, unlimited seats` : `${record.reserved} of ${record.capacity} seats booked`}
                              {record.price_override != null ? ` · price ${Number(record.price_override).toFixed(2)} ${record.currency}` : ""}
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${stateStyle[state]}`}>{stateLabel[state]}</span>
                        </div>
                        {record.capacity != null ? <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true"><div className={`h-full rounded-full ${state === "overbooked" ? "bg-rose-500" : state === "full" || state === "limited" ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${percent}%` }} /></div> : null}
                        {record.notes ? <p className="mt-2 text-xs text-slate-600">{record.notes}</p> : null}
                        <div className="mt-2 flex flex-wrap gap-1">
                          <button type="button" disabled={saving} onClick={() => void toggleClosed(record)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50">{record.blocked ? <><LockOpen size={14} aria-hidden="true" />Reopen</> : <><Lock size={14} aria-hidden="true" />Close</>}</button>
                          <button type="button" disabled={saving} onClick={() => startEdit(record)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-cyan-50 hover:text-cyan-800 disabled:opacity-50"><Pencil size={14} aria-hidden="true" />Edit</button>
                          <button type="button" disabled={saving} onClick={() => void remove(record)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"><Trash2 size={14} aria-hidden="true" />Delete</button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {!loading && !migration && !byDate.length ? <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">{records.length ? "No dates match this filter." : "No records in these dates. Every departure here is open with unlimited places."}</p> : null}
            {loading && !records.length ? <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Loading…</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
