/** Helpers for the admin sidebar's booking search (GET /api/admin/search). Pure, no I/O. */

export const ADMIN_SEARCH_MIN_LENGTH = 3;
export const ADMIN_SEARCH_MAX_LENGTH = 80;
export const ADMIN_SEARCH_LIMIT = 8;

export type AdminSearchBooking = {
  id: string;
  reference: string;
  customer_name: string | null;
  tour_name: string | null;
  date: string | null;
  status: string | null;
  archived_at: string | null;
  created_at?: string | null;
};
export type AdminSearchResult = {
  id: string;
  reference: string;
  customer_name: string;
  tour_name: string;
  date: string | null;
  status: string | null;
  archived: boolean;
  href: string;
};

/**
 * Normalises the raw `q` parameter. Returns null when it is too short to search.
 * Characters that carry meaning in PostgREST filter syntax (`,` `(` `)` `"` `\`)
 * are dropped, and so is `*`, which PostgREST turns into a LIKE wildcard. None of
 * them appear in references, names, emails or phone numbers.
 */
export function normalizeSearchQuery(raw: string | null | undefined) {
  const text = String(raw ?? "")
    .replace(/[,()"\\*]/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, ADMIN_SEARCH_MAX_LENGTH)
    .trim();
  return text.length >= ADMIN_SEARCH_MIN_LENGTH ? text : null;
}

/** A case-insensitive "contains" pattern for `.ilike()`, with LIKE wildcards in the input escaped. */
export function containsPattern(term: string) {
  return `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

/**
 * Regex for `imatch` on the phone column that matches the query's digits in order,
 * allowing spaces, dashes, dots, brackets or a plus between them ("0100 123" finds
 * "+20 100-123-4567"). Null when the query has fewer than 3 digits.
 */
export function phoneDigitsPattern(term: string) {
  const digits = term.replace(/\D/g, "");
  if (digits.length < 3) return null;
  return digits.split("").join("[^0-9]*");
}

/** Where a result opens: the bookings list for the trip's month, filtered to the reference. */
export function bookingSearchHref(reference: string, date: string | null, archived = false) {
  const params = new URLSearchParams();
  if (date && /^\d{4}-(0[1-9]|1[0-2])/.test(date)) params.set("month", date.slice(0, 7));
  params.set("search", reference);
  if (archived) params.set("archive", "all");
  return `/admin/bookings?${params.toString()}`;
}

/** Merge matches from several queries: de-duplicate, non-archived first, newest trip date first. */
export function rankSearchResults(rows: AdminSearchBooking[], limit = ADMIN_SEARCH_LIMIT): AdminSearchResult[] {
  const unique = new Map<string, AdminSearchBooking>();
  for (const row of rows) if (row?.id && !unique.has(row.id)) unique.set(row.id, row);
  return [...unique.values()]
    .sort((a, b) =>
      Number(Boolean(a.archived_at)) - Number(Boolean(b.archived_at)) ||
      (b.date || "").localeCompare(a.date || "") ||
      (b.created_at || "").localeCompare(a.created_at || "") ||
      a.reference.localeCompare(b.reference))
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      reference: row.reference,
      customer_name: row.customer_name || "Guest",
      tour_name: row.tour_name || "Transfer",
      date: row.date,
      status: row.status,
      archived: Boolean(row.archived_at),
      href: bookingSearchHref(row.reference, row.date, Boolean(row.archived_at)),
    }));
}
