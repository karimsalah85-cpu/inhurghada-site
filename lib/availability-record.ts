// Validation and display rules for one tour_availability row (one tour, one date, optional start time).
// Shared by the admin API (so bad values are rejected with a readable message instead of a raw
// database error) and by the admin editor (so both describe a date the same way).

export const MAX_CAPACITY = 10_000;
export const MAX_PRICE_OVERRIDE = 1_000_000;

export type AvailabilityFields = {
  tour_slug: string;
  service_date: string;
  start_time: string | null;
  capacity: number | null;
  blocked: boolean;
  price_override: number | null;
  currency: string;
  notes: string | null;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const blank = (value: unknown) => value === "" || value == null;

export function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  // Date.parse rolls 2026-02-31 over to March, so compare the round trip.
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value;
}

/** "9:30", "09:30" or "09:30:00" → "09:30:00"; empty → null (whole day). */
export function normalizeStartTime(value: unknown): Result<string | null> {
  if (blank(value)) return { ok: true, value: null };
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(value).trim());
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59 || Number(match[3] || 0) > 59) return { ok: false, error: "Enter the start time as HH:MM, or leave it empty for the whole day." };
  return { ok: true, value: `${match[1].padStart(2, "0")}:${match[2]}:${match[3] || "00"}` };
}

/**
 * Checks the fields that are present. With `partial` (an edit) missing fields are left alone;
 * without it (a new record) tour and date are required and the rest take their defaults.
 */
export function validateAvailabilityRecord(raw: unknown, options: { partial?: boolean; knownSlugs?: ReadonlySet<string> } = {}): Result<Partial<AvailabilityFields>> {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const has = (field: string) => !options.partial || Object.hasOwn(body, field);
  const value: Partial<AvailabilityFields> = {};

  if (has("tour_slug")) {
    const slug = String(body.tour_slug || "").trim();
    if (!/^[a-z0-9-]{1,160}$/.test(slug)) return { ok: false, error: "Choose a tour." };
    if (options.knownSlugs && !options.knownSlugs.has(slug)) return { ok: false, error: "That tour is not in the catalog. Choose a tour from the list." };
    value.tour_slug = slug;
  }
  if (has("service_date")) {
    const date = String(body.service_date || "").trim();
    if (!isIsoDate(date)) return { ok: false, error: "Choose a valid date." };
    value.service_date = date;
  }
  if (has("start_time")) {
    const time = normalizeStartTime(body.start_time);
    if (!time.ok) return time;
    value.start_time = time.value;
  }
  if (has("capacity")) {
    if (blank(body.capacity)) value.capacity = null;
    else {
      const capacity = Number(body.capacity);
      if (!Number.isInteger(capacity) || capacity < 0 || capacity > MAX_CAPACITY) return { ok: false, error: "Seats must be a whole number between 0 and 10,000, or empty for unlimited." };
      value.capacity = capacity;
    }
  }
  if (has("blocked")) value.blocked = body.blocked === true || body.blocked === "true";
  if (has("price_override")) {
    if (blank(body.price_override)) value.price_override = null;
    else {
      const price = Number(body.price_override);
      // Guests are charged this amount, so zero (a free trip) is refused rather than saved by mistake.
      if (!Number.isFinite(price) || price <= 0 || price > MAX_PRICE_OVERRIDE) return { ok: false, error: "The price must be more than 0, or empty to use the normal price." };
      value.price_override = Math.round(price * 100) / 100;
    }
  }
  if (has("currency")) {
    const currency = String(body.currency || "USD").trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) return { ok: false, error: "Use a three-letter currency code, such as USD." };
    value.currency = currency;
  }
  if (has("notes")) value.notes = String(body.notes || "").trim().slice(0, 500) || null;
  return { ok: true, value };
}

export type AvailabilityState = "closed" | "overbooked" | "full" | "limited" | "open";

/** How a date looks to the booking engine: a closure wins, then seats against bookings taken. */
export function availabilityState(row: { blocked?: boolean | null; capacity?: number | null; reserved?: number | null }): AvailabilityState {
  if (row.blocked) return "closed";
  if (row.capacity == null) return "open";
  const reserved = Number(row.reserved || 0);
  if (reserved > row.capacity) return "overbooked";
  if (reserved === row.capacity) return "full";
  return row.capacity - reserved <= 3 ? "limited" : "open";
}

/** Fields that decide which bookings a record counts. Moving them would strand its reserved places. */
export function movesReservedPlaces(before: { tour_slug: string; service_date: string; start_time: string | null }, update: Partial<AvailabilityFields>) {
  const time = (value: string | null | undefined) => (value ? value.slice(0, 8).padEnd(8, ":00").slice(0, 8) : null);
  return (update.tour_slug !== undefined && update.tour_slug !== before.tour_slug)
    || (update.service_date !== undefined && update.service_date !== String(before.service_date).slice(0, 10))
    || (update.start_time !== undefined && time(update.start_time) !== time(before.start_time));
}
