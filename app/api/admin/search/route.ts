import { NextRequest, NextResponse } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import {
  ADMIN_SEARCH_LIMIT, containsPattern, normalizeSearchQuery, phoneDigitsPattern, rankSearchResults,
  type AdminSearchBooking,
} from "@/lib/admin-search";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/utils/supabase/server";

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store", ...headers } });

const columns = "id,reference,customer_name,tour_name,date,status,archived_at,created_at";

/**
 * Sidebar booking search: up to 8 bookings whose reference, guest name, email or
 * phone digits match `q`. One query per column (no `.or()` filter string is built
 * from user input), then merged: non-archived first, newest trip date first.
 * Reads through the signed-in client, so bookings RLS still applies on top of the
 * permission check.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "Unauthorized.", results: [] }, 401);
  const [canBookings, canReports] = await Promise.all([
    hasLivePermission(supabase, user, "bookings"),
    hasLivePermission(supabase, user, "reports"),
  ]);
  if (!canBookings && !canReports) return json({ error: "Unauthorized.", results: [] }, 401);

  const term = normalizeSearchQuery(request.nextUrl.searchParams.get("q"));
  if (!term) return json({ results: [] });

  // Best-effort damping only: the sidebar debounces, so a burst far above this is a script.
  const limited = rateLimit(`admin-search:${user.id}`, 60, 60_000);
  if (!limited.allowed) return json({ error: "Too many searches. Try again shortly.", results: [] }, 429, { "Retry-After": String(limited.retryAfterSeconds) });

  const pattern = containsPattern(term);
  const phone = phoneDigitsPattern(term);
  const base = () => supabase.from("bookings").select(columns)
    .order("archived_at", { ascending: false, nullsFirst: true })
    .order("date", { ascending: false, nullsFirst: false })
    .limit(ADMIN_SEARCH_LIMIT);
  const settled = await Promise.all([
    base().ilike("reference", pattern),
    base().ilike("customer_name", pattern),
    base().ilike("customer_email", pattern),
    ...(phone ? [base().filter("phone", "imatch", phone)] : []),
  ]);
  if (settled.every((result) => result.error)) {
    console.error("Admin search failed", { message: settled[0].error?.message });
    return json({ error: "Search is unavailable right now.", results: [] }, 500);
  }
  const rows = settled.flatMap((result) => (result.error ? [] : (result.data || []) as AdminSearchBooking[]));
  return json({ results: rankSearchResults(rows) });
}
