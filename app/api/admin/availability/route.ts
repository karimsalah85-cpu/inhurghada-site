import { NextRequest, NextResponse } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import { isIsoDate } from "@/lib/availability-record";
import { createClient } from "@/utils/supabase/server";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const MAX_ROWS = 1000;

// Availability records for a date range, optionally for one tour. The editor pages through
// time with this instead of loading the whole table, which bulk edits grow to thousands of rows.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await hasLivePermission(supabase, user, "operations"))) return json({ error: "Unauthorized" }, 401);

  const params = request.nextUrl.searchParams;
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const tour = params.get("tour") || "";
  if (!isIsoDate(from) || !isIsoDate(to)) return json({ error: "Choose a valid start and end date." }, 400);
  if (to < from) return json({ error: "The end date must be on or after the start date." }, 400);
  if (tour && !/^[a-z0-9-]{1,160}$/.test(tour)) return json({ error: "Choose a valid tour." }, 400);

  let query = supabase.from("tour_availability")
    .select("id,tour_slug,service_date,start_time,capacity,reserved,blocked,price_override,currency,notes,updated_at", { count: "exact" })
    .gte("service_date", from).lte("service_date", to);
  if (tour) query = query.eq("tour_slug", tour);
  const { data, error, count } = await query.order("service_date").order("tour_slug").order("start_time", { nullsFirst: true }).range(0, MAX_ROWS - 1);
  if (error) {
    if (["42P01", "PGRST205"].includes(error.code || "")) return json({ configured: false, migration: "202608010001_admin_control_center.sql" });
    return json({ error: error.message }, 500);
  }
  return json({ configured: true, records: data || [], total: count ?? (data || []).length, truncated: (count ?? 0) > MAX_ROWS });
}
