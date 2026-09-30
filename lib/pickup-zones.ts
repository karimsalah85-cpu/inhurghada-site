import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Hotels & pickup zones. Bookings carry a free-text hotel; this module matches that text to the
 * admin-managed hotel list and looks up the standard pickup time for the hotel's zone and the
 * booking's tour. Everything here except `loadPickupZoneData` is pure.
 */

export const PICKUP_ZONES_MIGRATION = "20261001100000_pickup_zones.sql";
export const ZONE_DESTINATIONS = ["hurghada", "marsa-alam", "el-gouna", "jeddah"] as const;
export type ZoneDestination = (typeof ZONE_DESTINATIONS)[number];

export type PickupZoneRow = { id: string; name: string; destination: string; notes?: string | null; active: boolean | null };
export type HotelRow = { id: string; name: string; normalized_name: string; aliases: string[] | null; zone_id: string | null; active: boolean | null };
export type ZonePickupTimeRow = { zone_id: string; tour_slug: string; pickup_time: string };
export type PickupZoneData = { zones: PickupZoneRow[]; hotels: HotelRow[]; times: ZonePickupTimeRow[] };

// Words that say nothing about which hotel it is. "&"/"and" go too, so "Resort & Spa" and "Resort and Spa" agree.
const FILLER_WORDS = new Set(["the", "hotel", "hotels", "resort", "resorts", "and", "spa", "&"]);

/**
 * Lower-case, strip accents and punctuation, drop filler words ("hotel", "resort", "the", "&" ...) and
 * collapse spaces: "The Steigenberger Aqua Magic Hotel" and "steigenberger aqua-magic" both become
 * "steigenberger aqua magic". If only filler words remain (a hotel literally called "The Resort"), the
 * words are kept so the result is never empty for non-empty input.
 */
export function normalizeHotelName(value: string | null | undefined) {
  const base = String(value ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  if (!base) return "";
  const words = base.split(/\s+/);
  const meaningful = words.filter((word) => !FILLER_WORDS.has(word));
  return (meaningful.length ? meaningful : words).join(" ");
}

export type HotelIndex = { exact: Map<string, HotelRow>; prefixes: Array<[string, HotelRow]> };

/** Index hotels by normalized name and every alias. The first hotel wins if two share a key. */
export function buildHotelIndex(hotels: HotelRow[]): HotelIndex {
  const exact = new Map<string, HotelRow>();
  for (const hotel of hotels) {
    for (const key of [hotel.normalized_name || normalizeHotelName(hotel.name), normalizeHotelName(hotel.name), ...(hotel.aliases || []).map(normalizeHotelName)]) {
      if (key && !exact.has(key)) exact.set(key, hotel);
    }
  }
  const prefixes = [...exact.entries()].sort(([a], [b]) => b.length - a.length);
  return { exact, prefixes };
}

// What may follow a hotel name and still be the same hotel: a room number ("room 214", "rm 12", "214").
const ROOM_SUFFIX = /^(room|rm|no|nr|number)?\s*\d+[a-z]?$/;

/**
 * Match a booking's free-text hotel by exact normalized name or alias. The one fuzzy step: a room
 * number after a known name still matches ("Steigenberger Aqua Magic room 214"). Any other extra words
 * do not ("Hilton Hurghada Plaza" is not "Hilton Hurghada") — a wrong zone means a wrong pickup time,
 * so an unknown spelling is left unmatched for the admin to add as an alias.
 */
export function matchHotel(hotelText: string | null | undefined, index: HotelIndex): HotelRow | null {
  const key = normalizeHotelName(hotelText);
  if (!key) return null;
  const direct = index.exact.get(key);
  if (direct) return direct;
  for (const [prefix, hotel] of index.prefixes) if (key.startsWith(`${prefix} `) && ROOM_SUFFIX.test(key.slice(prefix.length + 1))) return hotel;
  return null;
}

/** "07:30:00" → "07:30"; anything that is not a time → null. */
export function shortTime(value: string | null | undefined) {
  const match = /^(\d{2}):(\d{2})/.exec(String(value ?? ""));
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return null;
  return `${match[1]}:${match[2]}`;
}

export type ZoneLookupResult = { hotel: HotelRow | null; zone: PickupZoneRow | null; time: string | null };
export type ZoneLookup = (hotelText: string | null | undefined, tourSlug: string | null | undefined) => ZoneLookupResult;

/**
 * Returns a function giving, for a booking's hotel text and tour, the matched hotel, its zone and the
 * zone's standard pickup time ("HH:MM") for that tour. Inactive hotels and zones give no zone.
 */
export function createZoneLookup(data: PickupZoneData | null | undefined): ZoneLookup {
  if (!data) return () => ({ hotel: null, zone: null, time: null });
  const index = buildHotelIndex(data.hotels);
  const zones = new Map(data.zones.map((zone) => [zone.id, zone]));
  const times = new Map(data.times.map((row) => [`${row.zone_id}|${row.tour_slug}`, shortTime(row.pickup_time)]));
  return (hotelText, tourSlug) => {
    const hotel = matchHotel(hotelText, index);
    if (!hotel || hotel.active === false || !hotel.zone_id) return { hotel, zone: null, time: null };
    const zone = zones.get(hotel.zone_id);
    if (!zone || zone.active === false) return { hotel, zone: null, time: null };
    return { hotel, zone, time: tourSlug ? times.get(`${zone.id}|${tourSlug}`) ?? null : null };
  };
}

export type UnmatchedHotel = { text: string; normalized: string; bookings: number; firstDate: string | null; lastDate: string | null };

/** Distinct booking hotel strings that match no hotel, grouped by normalized form, most bookings first. */
export function findUnmatchedHotels(bookings: Array<{ hotel: string | null; date: string | null }>, hotels: HotelRow[]): UnmatchedHotel[] {
  const index = buildHotelIndex(hotels);
  const groups = new Map<string, UnmatchedHotel & { spellings: Map<string, number> }>();
  for (const booking of bookings) {
    const text = booking.hotel?.trim();
    if (!text) continue;
    const normalized = normalizeHotelName(text);
    if (!normalized || matchHotel(text, index)) continue;
    const group = groups.get(normalized) || { text, normalized, bookings: 0, firstDate: null, lastDate: null, spellings: new Map() };
    group.bookings += 1;
    group.spellings.set(text, (group.spellings.get(text) || 0) + 1);
    if (booking.date && (!group.firstDate || booking.date < group.firstDate)) group.firstDate = booking.date;
    if (booking.date && (!group.lastDate || booking.date > group.lastDate)) group.lastDate = booking.date;
    groups.set(normalized, group);
  }
  return [...groups.values()]
    .map(({ spellings, ...group }) => ({ ...group, text: [...spellings.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0] }))
    .sort((a, b) => b.bookings - a.bookings || a.text.localeCompare(b.text));
}

export const isMissingTableError = (error: { code?: string | null } | null | undefined) => Boolean(error && ["42P01", "PGRST205"].includes(error.code || ""));

/**
 * Loads zones, hotels and (optionally only some tours') zone pickup times. Returns null when the
 * tables do not exist yet (the code ships before the migration) or on any read error — callers then
 * behave exactly as before zones existed.
 */
export async function loadPickupZoneData(supabase: SupabaseClient, tourSlugs?: string[]): Promise<PickupZoneData | null> {
  if (tourSlugs && !tourSlugs.length) return null;
  let timesQuery = supabase.from("zone_pickup_times").select("zone_id,tour_slug,pickup_time");
  if (tourSlugs) timesQuery = timesQuery.in("tour_slug", tourSlugs);
  const [zones, hotels, times] = await Promise.all([
    supabase.from("pickup_zones").select("id,name,destination,active").limit(1000),
    supabase.from("hotels").select("id,name,normalized_name,aliases,zone_id,active").limit(10_000),
    timesQuery.limit(20_000),
  ]);
  const error = zones.error || hotels.error || times.error;
  if (error) {
    if (!isMissingTableError(error)) console.error("Could not load pickup zones; using booking times only", { message: error.message });
    return null;
  }
  return { zones: (zones.data || []) as PickupZoneRow[], hotels: (hotels.data || []) as HotelRow[], times: (times.data || []) as ZonePickupTimeRow[] };
}

// ---------------------------------------------------------------------------
// Input validation for the admin routes.
// ---------------------------------------------------------------------------
type Valid<T> = { ok: true; value: T } | { ok: false; error: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clean = (value: unknown, max: number) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
export const isUuid = (value: unknown) => typeof value === "string" && UUID.test(value);

export function validateZone(body: unknown): Valid<{ name: string; destination: ZoneDestination; notes: string | null; active: boolean }> {
  const input = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const name = clean(input.name, 120);
  const destination = clean(input.destination, 20) as ZoneDestination;
  if (!name) return { ok: false, error: "Enter a zone name." };
  if (!ZONE_DESTINATIONS.includes(destination)) return { ok: false, error: "Choose a destination." };
  return { ok: true, value: { name, destination, notes: String(input.notes ?? "").trim().slice(0, 1000) || null, active: input.active !== false } };
}

export function parseAliases(value: unknown) {
  const list = Array.isArray(value) ? value : String(value ?? "").split(/[,\n;]/);
  const seen = new Set<string>();
  const aliases: string[] = [];
  for (const item of list) {
    const alias = clean(item, 200);
    const key = normalizeHotelName(alias);
    if (!alias || !key || seen.has(key)) continue;
    seen.add(key);
    aliases.push(alias);
  }
  return aliases.slice(0, 30);
}

export function validateHotel(body: unknown): Valid<{ name: string; normalized_name: string; aliases: string[]; zone_id: string | null; active: boolean }> {
  const input = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const name = clean(input.name, 200);
  const normalized = normalizeHotelName(name);
  if (!name || !normalized) return { ok: false, error: "Enter a hotel name." };
  const zone = input.zone_id === "" || input.zone_id == null ? null : input.zone_id;
  if (zone !== null && !isUuid(zone)) return { ok: false, error: "Choose a valid pickup zone." };
  const aliases = parseAliases(input.aliases).filter((alias) => normalizeHotelName(alias) !== normalized);
  return { ok: true, value: { name, normalized_name: normalized, aliases, zone_id: zone as string | null, active: input.active !== false } };
}

export function validateZoneTime(body: unknown, tourSlugs: Set<string>): Valid<{ zone_id: string; tour_slug: string; pickup_time: string | null }> {
  const input = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  if (!isUuid(input.zone_id)) return { ok: false, error: "Choose a pickup zone." };
  const tour = clean(input.tour_slug, 160);
  if (!tourSlugs.has(tour)) return { ok: false, error: "Choose a tour." };
  const raw = clean(input.pickup_time, 8);
  if (!raw) return { ok: true, value: { zone_id: input.zone_id as string, tour_slug: tour, pickup_time: null } };
  const time = /^\d{2}:\d{2}(:\d{2})?$/.test(raw) ? shortTime(raw) : null;
  if (!time) return { ok: false, error: "Enter the pickup time as HH:MM (24-hour)." };
  return { ok: true, value: { zone_id: input.zone_id as string, tour_slug: tour, pickup_time: time } };
}
