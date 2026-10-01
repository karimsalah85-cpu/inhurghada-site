export type BulkAvailabilityAction = "capacity" | "close" | "reopen";

export type BulkAvailabilityInput = {
  tourSlugs: string[];
  from: string;
  to: string;
  weekdays: number[]; // 0 = Sunday … 6 = Saturday
  action: BulkAvailabilityAction;
  capacity?: number | null;
  note?: string;
};

export const MAX_BULK_DAYS = 400;
export const MAX_BULK_ROWS = 20_000;
export const SEA_CATEGORIES = ["Boat Cruise", "Diving", "Family Sea Activity", "Island Trip", "Snorkeling", "Speedboat Trip"];

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export function validateBulkAvailability(raw: unknown): { ok: true; value: BulkAvailabilityInput } | { ok: false; error: string } {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const tourSlugs = Array.isArray(body.tourSlugs) ? [...new Set(body.tourSlugs.map((slug) => String(slug).trim()).filter((slug) => /^[a-z0-9-]{1,120}$/.test(slug)))] : [];
  if (!tourSlugs.length) return { ok: false, error: "Choose at least one tour." };
  const from = String(body.from || "");
  const to = String(body.to || "");
  if (!isoDate.test(from) || !isoDate.test(to) || Number.isNaN(Date.parse(`${from}T00:00:00Z`)) || Number.isNaN(Date.parse(`${to}T00:00:00Z`))) return { ok: false, error: "Choose a valid start and end date." };
  if (to < from) return { ok: false, error: "The end date must be on or after the start date." };
  const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000 + 1;
  if (days > MAX_BULK_DAYS) return { ok: false, error: `Choose a range of at most ${MAX_BULK_DAYS} days.` };
  const weekdays = Array.isArray(body.weekdays) ? [...new Set(body.weekdays.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))] : [];
  if (!weekdays.length) return { ok: false, error: "Choose at least one weekday." };
  const action = body.action;
  if (action !== "capacity" && action !== "close" && action !== "reopen") return { ok: false, error: "Choose what to do." };
  let capacity: number | null = null;
  if (action === "capacity") {
    if (body.capacity === "" || body.capacity == null) capacity = null;
    else {
      capacity = Number(body.capacity);
      if (!Number.isInteger(capacity) || capacity < 0 || capacity > 10_000) return { ok: false, error: "Capacity must be a whole number between 0 and 10,000, or empty for unlimited." };
    }
  }
  const note = String(body.note || "").trim().slice(0, 200);
  const value = { tourSlugs, from, to, weekdays, action, capacity, note } satisfies BulkAvailabilityInput;
  if (bulkDates(value).length * tourSlugs.length > MAX_BULK_ROWS) return { ok: false, error: "That would change too many dates at once. Choose fewer tours or a shorter range." };
  return { ok: true, value };
}

/** Every date in the range that falls on one of the chosen weekdays. */
export function bulkDates({ from, to, weekdays }: Pick<BulkAvailabilityInput, "from" | "to" | "weekdays">) {
  const wanted = new Set(weekdays);
  const dates: string[] = [];
  for (let time = Date.parse(`${from}T00:00:00Z`), end = Date.parse(`${to}T00:00:00Z`); time <= end; time += 86_400_000) {
    const date = new Date(time);
    if (wanted.has(date.getUTCDay())) dates.push(date.toISOString().slice(0, 10));
  }
  return dates;
}

type ExistingRow = { id: string; tour_slug: string; service_date: string; start_time: string | null; capacity: number | null; reserved: number; blocked: boolean };
type BookingLoad = { tour_slug: string | null; date: string | null; guests: number | null };

export type BulkPlan = {
  updates: Array<{ id: string; patch: Record<string, unknown> }>;
  inserts: Array<Record<string, unknown>>;
  overbooked: Array<{ tour_slug: string; service_date: string; reserved: number; capacity: number }>;
  /** Closed dates in range that a "set seats" change leaves closed. */
  stillClosed: number;
};

/**
 * Works out the row changes. Existing rows for a tour and date (any start time) are updated;
 * dates with no row get a whole-day row whose `reserved` counts bookings already taken, so a
 * new capacity limit is measured against real demand rather than starting from zero.
 */
export function planBulkAvailability(input: BulkAvailabilityInput, existing: ExistingRow[], bookings: BookingLoad[]): BulkPlan {
  const dates = bulkDates(input);
  const rowsByKey = new Map<string, ExistingRow[]>();
  for (const row of existing) {
    const key = `${row.tour_slug}|${row.service_date}`;
    rowsByKey.set(key, [...(rowsByKey.get(key) || []), row]);
  }
  const loadByKey = new Map<string, number>();
  for (const booking of bookings) {
    if (!booking.tour_slug || !booking.date) continue;
    const key = `${booking.tour_slug}|${booking.date}`;
    loadByKey.set(key, (loadByKey.get(key) || 0) + Math.max(0, Number(booking.guests || 0)));
  }
  const now = new Date().toISOString();
  const plan: BulkPlan = { updates: [], inserts: [], overbooked: [], stillClosed: 0 };
  const patchFor = (): Record<string, unknown> => {
    const base: Record<string, unknown> = { updated_at: now };
    // Setting seats never reopens a closed date (e.g. a weather closure inside the season range).
    if (input.action === "capacity") base.capacity = input.capacity ?? null;
    if (input.action === "close") base.blocked = true;
    if (input.action === "reopen") base.blocked = false;
    if (input.note) base.notes = input.note;
    return base;
  };
  for (const tour_slug of input.tourSlugs) for (const service_date of dates) {
    const key = `${tour_slug}|${service_date}`;
    const rows = rowsByKey.get(key);
    if (rows?.length) {
      for (const row of rows) {
        plan.updates.push({ id: row.id, patch: patchFor() });
        if (input.action === "capacity" && row.blocked) plan.stillClosed += 1;
        if (input.action === "capacity" && input.capacity != null && row.reserved > input.capacity) plan.overbooked.push({ tour_slug, service_date, reserved: row.reserved, capacity: input.capacity });
      }
      continue;
    }
    if (input.action === "reopen") continue; // nothing to reopen: a date without a row is already open
    if (input.action === "capacity" && input.capacity == null) continue; // unlimited is the default already
    const reserved = loadByKey.get(key) || 0;
    plan.inserts.push({ tour_slug, service_date, start_time: null, reserved, currency: "USD", blocked: false, ...patchFor(), capacity: input.action === "capacity" ? input.capacity : null });
    if (input.action === "capacity" && input.capacity != null && reserved > input.capacity) plan.overbooked.push({ tour_slug, service_date, reserved, capacity: input.capacity });
  }
  return plan;
}

type MultiTripBooking = { reference: string; pricing_snapshot: unknown };

/**
 * Multi-trip bookings are saved under tour_slug "multi-trip"; each leg is only in the pricing
 * snapshot (name, date, participants). Legs are matched back to tours by title. Bookings whose
 * legs can't be read are returned as `unknown` so the admin is warned rather than under-counting.
 */
export function multiTripLoads(bookings: MultiTripBooking[], slugByTitle: Map<string, string>, range: { from: string; to: string }) {
  const loads: BookingLoad[] = [];
  const unknown: string[] = [];
  for (const booking of bookings) {
    const trips = (booking.pricing_snapshot as { trips?: unknown } | null)?.trips;
    if (!Array.isArray(trips) || !trips.length) { unknown.push(booking.reference); continue; }
    let readable = true;
    for (const trip of trips as Array<{ name?: unknown; date?: unknown; guests?: unknown; participants?: { adults?: unknown; youth?: unknown; infants?: unknown } }>) {
      const slug = typeof trip.name === "string" ? slugByTitle.get(trip.name.trim().toLowerCase()) : undefined;
      const date = typeof trip.date === "string" ? trip.date : null;
      if (!slug || !date) { readable = false; continue; }
      if (date < range.from || date > range.to) continue;
      const participants = trip.participants || {};
      const places = Number(participants.adults || 0) + Number(participants.youth || 0) + Number(participants.infants || 0) || Number(trip.guests || 0);
      loads.push({ tour_slug: slug, date, guests: places });
    }
    if (!readable) unknown.push(booking.reference);
  }
  return { loads, unknown };
}
