"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, Hotel, MapPinned, Plus, RefreshCw, Trash2, TriangleAlert } from "lucide-react";
import { ZONE_DESTINATIONS, shortTime } from "@/lib/pickup-zones";

type Zone = { id: string; name: string; destination: string; notes: string | null; active: boolean };
type HotelRecord = { id: string; name: string; normalized_name: string; aliases: string[] | null; zone_id: string | null; active: boolean };
type TimeRow = { zone_id: string; tour_slug: string; pickup_time: string };
type Tour = { slug: string; title: string; destination: string; category: string; availableTimes: string[] };
type Unmatched = { text: string; normalized: string; bookings: number; firstDate: string | null; lastDate: string | null };
type Payload =
  | { configured: false; migration: string }
  | { configured: true; zones: Zone[]; hotels: HotelRecord[]; times: TimeRow[]; tours: Tour[]; unmatched: Unmatched[]; unmatchedSince: string };

const destinationLabels: Record<string, string> = { hurghada: "Hurghada", "marsa-alam": "Marsa Alam", "el-gouna": "El Gouna", jeddah: "Jeddah" };
const input = "rounded-xl border border-slate-200 p-2.5 text-sm";
const primary = "inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50";
const secondary = "rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50";
const cardClass = "rounded-3xl bg-white p-5 shadow-sm sm:p-6";

async function send(url: string, method: string, body?: unknown) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Could not save the change.");
  return result;
}

async function fetchPayload(): Promise<{ data?: Payload; error?: string }> {
  try {
    const response = await fetch("/api/admin/pickup-zones", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    // 409 with configured:false = tables not migrated yet; shown as "Database upgrade required".
    if (response.ok || (response.status === 409 && body.configured === false)) return { data: body as Payload };
    return { error: body.error || "Could not load hotels and zones." };
  } catch { return { error: "Could not load hotels and zones." }; }
}

export default function PickupZonesManager() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [destination, setDestination] = useState<string>("hurghada");

  const apply = useCallback((result: { data?: Payload; error?: string }) => {
    if (result.data) { setData(result.data); setError(""); } else setError(result.error || "Could not load hotels and zones.");
    setLoading(false);
  }, []);
  const load = useCallback(async () => { setLoading(true); apply(await fetchPayload()); }, [apply]);
  useEffect(() => { void fetchPayload().then(apply); }, [apply]);

  async function run(key: string, action: () => Promise<unknown>, done?: string) {
    setBusy(key); setError(""); setNotice("");
    try { await action(); if (done) setNotice(done); await load(); return true; }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save the change."); return false; }
    finally { setBusy(""); }
  }

  if (loading && !data) return <p className="rounded-2xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading hotels and pickup zones…</p>;
  if (data?.configured === false) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><p className="font-black">Database upgrade required</p><p className="mt-2">Run <code>{data.migration}</code> in the Supabase SQL Editor, then refresh this page. Until then the manifest and reminders keep using assignment and departure times.</p></div>;
  if (!data) return <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-rose-800">{error || "Could not load hotels and zones."}</p>;

  return <div className="space-y-8">
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-sm text-slate-600">Pickup time used for each booking: <strong>time set on the assignment</strong> → <strong>zone time for the tour</strong> → <strong>tour departure time</strong>.</p>
      <button type="button" onClick={() => void load()} className="ml-auto inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/>Refresh</button>
    </div>
    {error ? <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</p> : null}
    {notice ? <p role="status" className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{notice}</p> : null}
    <UnmatchedPanel data={data} busy={busy} run={run} />
    <ZonesPanel zones={data.zones} hotels={data.hotels} busy={busy} run={run} />
    <TimesGrid data={data} destination={destination} setDestination={setDestination} busy={busy} run={run} />
    <HotelsPanel zones={data.zones} hotels={data.hotels} busy={busy} run={run} />
  </div>;
}

type Run = (key: string, action: () => Promise<unknown>, done?: string) => Promise<boolean>;

function ZoneSelect({ zones, value, onChange, label, disabled }: { zones: Zone[]; value: string; onChange: (value: string) => void; label: string; disabled?: boolean }) {
  return <select aria-label={label} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={input}>
    <option value="">No zone</option>
    {ZONE_DESTINATIONS.map((destination) => {
      const options = zones.filter((zone) => zone.destination === destination);
      return options.length ? <optgroup key={destination} label={destinationLabels[destination]}>{options.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}{zone.active ? "" : " (inactive)"}</option>)}</optgroup> : null;
    })}
  </select>;
}

function UnmatchedPanel({ data, busy, run }: { data: Extract<Payload, { configured: true }>; busy: string; run: Run }) {
  const [zoneFor, setZoneFor] = useState<Record<string, string>>({});
  const [aliasFor, setAliasFor] = useState<Record<string, string>>({});
  const hotelsById = useMemo(() => new Map(data.hotels.map((hotel) => [hotel.id, hotel])), [data.hotels]);
  return <section className={cardClass}>
    <div className="flex items-start gap-3"><TriangleAlert className="mt-1 text-amber-600" size={24} aria-hidden="true"/><div><h2 className="text-2xl font-bold">Unmatched hotels</h2><p className="mt-1 text-sm text-slate-500">Hotels typed on bookings since {data.unmatchedSince} (and all upcoming) that are not on the hotel list. Add each as a hotel with its zone, or as another spelling of a hotel you already have.</p></div></div>
    {!data.unmatched.length ? <p className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Every booking hotel matches the list.</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Hotel on bookings</th><th className="p-3">Bookings</th><th className="p-3">Add as hotel</th><th className="p-3">Or spelling of</th></tr></thead>
      <tbody>{data.unmatched.map((row) => {
        const key = `unmatched:${row.normalized}`;
        const aliasTarget = hotelsById.get(aliasFor[row.normalized] || "");
        return <tr key={row.normalized} className="border-t border-slate-100 align-middle">
          <td className="p-3"><span className="font-semibold">{row.text}</span></td>
          <td className="p-3 whitespace-nowrap"><span className="font-black">{row.bookings}</span><span className="block text-xs text-slate-500">{row.firstDate === row.lastDate ? row.firstDate : `${row.firstDate} → ${row.lastDate}`}</span></td>
          <td className="p-3"><div className="flex flex-wrap items-center gap-2">
            <ZoneSelect zones={data.zones} label={`Zone for ${row.text}`} value={zoneFor[row.normalized] || ""} onChange={(value) => setZoneFor((current) => ({ ...current, [row.normalized]: value }))}/>
            <button type="button" disabled={busy === key} onClick={() => void run(key, () => send("/api/admin/pickup-zones/hotels", "POST", { name: row.text, zone_id: zoneFor[row.normalized] || null }), `Added ${row.text}.`)} className={secondary}><Plus size={13} className="inline"/> Add as hotel</button>
          </div></td>
          <td className="p-3"><div className="flex flex-wrap items-center gap-2">
            <select aria-label={`Existing hotel for ${row.text}`} value={aliasFor[row.normalized] || ""} onChange={(event) => setAliasFor((current) => ({ ...current, [row.normalized]: event.target.value }))} className={`${input} max-w-[220px]`}>
              <option value="">Choose hotel…</option>
              {data.hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}
            </select>
            <button type="button" disabled={!aliasTarget || busy === key} onClick={() => aliasTarget && void run(key, () => send(`/api/admin/pickup-zones/hotels/${aliasTarget.id}`, "PATCH", { ...aliasTarget, aliases: [...(aliasTarget.aliases || []), row.text] }), `"${row.text}" now matches ${aliasTarget.name}.`)} className={secondary}>Add spelling</button>
          </div></td>
        </tr>;
      })}</tbody>
    </table></div>}
  </section>;
}

function ZonesPanel({ zones, hotels, busy, run }: { zones: Zone[]; hotels: HotelRecord[]; busy: string; run: Run }) {
  const blank = { name: "", destination: "hurghada", notes: "", active: true };
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState(blank);
  const hotelCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const hotel of hotels) if (hotel.zone_id) counts.set(hotel.zone_id, (counts.get(hotel.zone_id) || 0) + 1);
    return counts;
  }, [hotels]);
  return <section className={cardClass}>
    <div className="flex items-start gap-3"><MapPinned className="mt-1 text-cyan-700" size={24} aria-hidden="true"/><div><h2 className="text-2xl font-bold">Pickup zones</h2><p className="mt-1 text-sm text-slate-500">Areas a vehicle collects from in one run, e.g. Sahl Hasheesh, Makadi Bay, Hurghada centre (Sheraton Road).</p></div></div>
    <form className="mt-5 grid gap-2 sm:grid-cols-[1fr_180px_1fr_auto]" onSubmit={async (event) => { event.preventDefault(); if (await run("zone:new", () => send("/api/admin/pickup-zones/zones", "POST", form), `Added zone ${form.name}.`)) setForm(blank); }}>
      <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Zone name" aria-label="Zone name" className={input}/>
      <select value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })} aria-label="Destination" className={input}>{ZONE_DESTINATIONS.map((value) => <option key={value} value={value}>{destinationLabels[value]}</option>)}</select>
      <input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Notes (optional)" aria-label="Zone notes" className={input}/>
      <button type="submit" disabled={busy === "zone:new"} className={primary}><Plus size={16}/>Add zone</button>
    </form>
    {!zones.length ? <p className="mt-5 text-sm text-slate-500">No zones yet.</p> : <ul className="mt-5 divide-y divide-slate-100">{zones.map((zone) => {
      const key = `zone:${zone.id}`;
      return <li key={zone.id} className="py-3">{editing === zone.id ? <form className="grid gap-2 sm:grid-cols-[1fr_160px_1fr_auto_auto_auto]" onSubmit={async (event) => { event.preventDefault(); if (await run(key, () => send(`/api/admin/pickup-zones/zones/${zone.id}`, "PATCH", draft), "Zone saved.")) setEditing(null); }}>
        <input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} aria-label="Zone name" className={input}/>
        <select value={draft.destination} onChange={(event) => setDraft({ ...draft, destination: event.target.value })} aria-label="Destination" className={input}>{ZONE_DESTINATIONS.map((value) => <option key={value} value={value}>{destinationLabels[value]}</option>)}</select>
        <input value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Notes" aria-label="Zone notes" className={input}/>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })}/>Active</label>
        <button type="submit" disabled={busy === key} className={primary}>Save</button>
        <button type="button" onClick={() => setEditing(null)} className={secondary}>Cancel</button>
      </form> : <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1"><p className="font-bold">{zone.name}{zone.active ? null : <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">Inactive</span>}</p><p className="text-xs text-slate-500">{destinationLabels[zone.destination] || zone.destination} · {hotelCount.get(zone.id) || 0} hotel{hotelCount.get(zone.id) === 1 ? "" : "s"}{zone.notes ? ` · ${zone.notes}` : ""}</p></div>
        <button type="button" onClick={() => { setEditing(zone.id); setDraft({ name: zone.name, destination: zone.destination, notes: zone.notes || "", active: zone.active }); }} className={secondary}>Edit</button>
        <button type="button" disabled={busy === key} aria-label={`Delete ${zone.name}`} onClick={() => { if (window.confirm(`Delete ${zone.name}? Its pickup times are removed and its hotels are left without a zone.`)) void run(key, () => send(`/api/admin/pickup-zones/zones/${zone.id}`, "DELETE"), `Deleted ${zone.name}.`); }} className="rounded-lg p-2 text-rose-700 hover:bg-rose-50"><Trash2 size={15}/></button>
      </div>}</li>;
    })}</ul>}
  </section>;
}

function TimesGrid({ data, destination, setDestination, busy, run }: { data: Extract<Payload, { configured: true }>; destination: string; setDestination: (value: string) => void; busy: string; run: Run }) {
  const [filter, setFilter] = useState("");
  const zones = data.zones.filter((zone) => zone.destination === destination && zone.active);
  const needle = filter.trim().toLowerCase();
  const tours = data.tours.filter((tour) => tour.destination === destination && (!needle || `${tour.title} ${tour.category}`.toLowerCase().includes(needle)));
  const times = useMemo(() => new Map(data.times.map((row) => [`${row.zone_id}|${row.tour_slug}`, shortTime(row.pickup_time) || ""])), [data.times]);
  const save = (zone: Zone, tour: Tour, value: string) => {
    const key = `${zone.id}|${tour.slug}`;
    if ((times.get(key) || "") === value) return;
    void run(`time:${key}`, () => send("/api/admin/pickup-zones/times", "PUT", { zone_id: zone.id, tour_slug: tour.slug, pickup_time: value }), value ? `${tour.title}: ${zone.name} pickup ${value}.` : `${tour.title}: ${zone.name} pickup cleared.`);
  };
  return <section className={cardClass}>
    <div className="flex items-start gap-3"><Clock className="mt-1 text-cyan-700" size={24} aria-hidden="true"/><div><h2 className="text-2xl font-bold">Standard pickup times</h2><p className="mt-1 text-sm text-slate-500">One time per zone and tour. Leave a cell empty to fall back to the tour&apos;s departure time. Changes save when you leave the cell.</p></div></div>
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {ZONE_DESTINATIONS.map((value) => <button key={value} type="button" aria-pressed={destination === value} onClick={() => setDestination(value)} className={`rounded-xl border px-3 py-2 text-sm font-bold ${destination === value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"}`}>{destinationLabels[value]}</button>)}
      <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter tours…" aria-label="Filter tours" className={`${input} min-w-0 flex-1`}/>
    </div>
    {!zones.length ? <p className="mt-5 text-sm text-slate-500">No active zones in {destinationLabels[destination]} yet — add one above.</p> : !tours.length ? <p className="mt-5 text-sm text-slate-500">No tours match.</p> : <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="sticky left-0 bg-slate-50 p-3">Tour</th>{zones.map((zone) => <th key={zone.id} className="whitespace-nowrap p-3">{zone.name}</th>)}</tr></thead>
      <tbody>{tours.map((tour) => <tr key={tour.slug} className="border-t border-slate-100">
        <td className="sticky left-0 min-w-[220px] bg-white p-3"><span className="font-semibold">{tour.title}</span><span className="block text-xs text-slate-500">{tour.category}{tour.availableTimes.length ? ` · ${tour.availableTimes.join(", ")}` : ""}</span></td>
        {zones.map((zone) => {
          const key = `${zone.id}|${tour.slug}`;
          return <td key={`${key}|${times.get(key) || ""}`} className="p-2"><input type="time" defaultValue={times.get(key) || ""} disabled={busy === `time:${key}`} aria-label={`${tour.title} pickup from ${zone.name}`} onBlur={(event) => save(zone, tour, event.currentTarget.value)} className="w-[110px] rounded-lg border border-slate-200 p-2 text-sm font-bold"/></td>;
        })}
      </tr>)}</tbody>
    </table></div>}
  </section>;
}

function HotelsPanel({ zones, hotels, busy, run }: { zones: Zone[]; hotels: HotelRecord[]; busy: string; run: Run }) {
  const blank = { name: "", zone_id: "", aliases: "" };
  const [form, setForm] = useState(blank);
  const [filter, setFilter] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ ...blank, active: true });
  const zonesById = useMemo(() => new Map(zones.map((zone) => [zone.id, zone])), [zones]);
  const needle = filter.trim().toLowerCase();
  const shown = hotels.filter((hotel) => (zoneFilter === "all" || (zoneFilter === "none" ? !hotel.zone_id : hotel.zone_id === zoneFilter)) && (!needle || `${hotel.name} ${(hotel.aliases || []).join(" ")}`.toLowerCase().includes(needle)));
  const patch = (hotel: HotelRecord, change: Partial<HotelRecord>) => send(`/api/admin/pickup-zones/hotels/${hotel.id}`, "PATCH", { name: hotel.name, zone_id: hotel.zone_id, aliases: hotel.aliases || [], active: hotel.active, ...change });
  return <section className={cardClass}>
    <div className="flex items-start gap-3"><Hotel className="mt-1 text-cyan-700" size={24} aria-hidden="true"/><div><h2 className="text-2xl font-bold">Hotels</h2><p className="mt-1 text-sm text-slate-500">Bookings match a hotel by name or any of its other spellings, ignoring case, accents, punctuation and words like &ldquo;hotel&rdquo;, &ldquo;resort&rdquo; and &ldquo;the&rdquo;.</p></div></div>
    <form className="mt-5 grid gap-2 sm:grid-cols-[1fr_200px_1fr_auto]" onSubmit={async (event) => { event.preventDefault(); if (await run("hotel:new", () => send("/api/admin/pickup-zones/hotels", "POST", form), `Added ${form.name}.`)) setForm(blank); }}>
      <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Hotel name" aria-label="Hotel name" className={input}/>
      <ZoneSelect zones={zones} label="Zone" value={form.zone_id} onChange={(value) => setForm({ ...form, zone_id: value })}/>
      <input value={form.aliases} onChange={(event) => setForm({ ...form, aliases: event.target.value })} placeholder="Other spellings, comma-separated" aria-label="Other spellings" className={input}/>
      <button type="submit" disabled={busy === "hotel:new"} className={primary}><Plus size={16}/>Add hotel</button>
    </form>
    <div className="mt-5 flex flex-wrap gap-2">
      <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search hotels…" aria-label="Search hotels" className={`${input} min-w-0 flex-1`}/>
      <select value={zoneFilter} onChange={(event) => setZoneFilter(event.target.value)} aria-label="Filter by zone" className={input}><option value="all">All zones</option><option value="none">No zone</option>{zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select>
    </div>
    <p className="mt-3 text-xs font-semibold text-slate-500">{shown.length} of {hotels.length} hotel{hotels.length === 1 ? "" : "s"}</p>
    {!shown.length ? null : <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Hotel</th><th className="p-3">Zone</th><th className="p-3">Other spellings</th><th className="p-3"></th></tr></thead>
      <tbody>{shown.map((hotel) => {
        const key = `hotel:${hotel.id}`;
        if (editing === hotel.id) return <tr key={hotel.id} className="border-t border-slate-100 align-top"><td colSpan={4} className="p-3"><form className="grid gap-2 sm:grid-cols-[1fr_200px_1fr_auto_auto_auto]" onSubmit={async (event) => { event.preventDefault(); if (await run(key, () => send(`/api/admin/pickup-zones/hotels/${hotel.id}`, "PATCH", draft), "Hotel saved.")) setEditing(null); }}>
          <input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} aria-label="Hotel name" className={input}/>
          <ZoneSelect zones={zones} label="Zone" value={draft.zone_id} onChange={(value) => setDraft({ ...draft, zone_id: value })}/>
          <input value={draft.aliases} onChange={(event) => setDraft({ ...draft, aliases: event.target.value })} placeholder="Other spellings, comma-separated" aria-label="Other spellings" className={input}/>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })}/>Active</label>
          <button type="submit" disabled={busy === key} className={primary}>Save</button>
          <button type="button" onClick={() => setEditing(null)} className={secondary}>Cancel</button>
        </form></td></tr>;
        const zone = hotel.zone_id ? zonesById.get(hotel.zone_id) : undefined;
        return <tr key={hotel.id} className="border-t border-slate-100 align-middle">
          <td className="p-3"><span className="font-semibold">{hotel.name}</span>{hotel.active ? null : <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">Inactive</span>}</td>
          <td className="p-3"><ZoneSelect zones={zones} label={`Zone for ${hotel.name}`} value={hotel.zone_id || ""} disabled={busy === key} onChange={(value) => void run(key, () => patch(hotel, { zone_id: value || null }), `${hotel.name} moved to ${value ? zonesById.get(value)?.name : "no zone"}.`)}/>{!zone ? <span className="mt-1 block text-xs font-semibold text-amber-700">No zone — no standard pickup time</span> : null}</td>
          <td className="p-3 text-xs text-slate-600">{(hotel.aliases || []).join(", ") || "—"}</td>
          <td className="p-3 text-right whitespace-nowrap">
            <button type="button" onClick={() => { setEditing(hotel.id); setDraft({ name: hotel.name, zone_id: hotel.zone_id || "", aliases: (hotel.aliases || []).join(", "), active: hotel.active }); }} className={secondary}>Edit</button>
            <button type="button" disabled={busy === key} aria-label={`Remove ${hotel.name}`} onClick={() => { if (window.confirm(`Remove ${hotel.name} from the hotel list? Bookings keep their hotel text.`)) void run(key, () => send(`/api/admin/pickup-zones/hotels/${hotel.id}`, "DELETE"), `Removed ${hotel.name}.`); }} className="ml-1 rounded-lg p-2 text-rose-700 hover:bg-rose-50"><Trash2 size={15}/></button>
          </td>
        </tr>;
      })}</tbody>
    </table></div>}
  </section>;
}
