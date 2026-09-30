import { NextRequest, NextResponse } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createClient } from "@/utils/supabase/server";
import { planBulkAvailability, validateBulkAvailability } from "@/lib/availability-bulk";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

// Sets capacity, closes or reopens many tour dates at once (e.g. every Orange Bay departure this
// season, or all sea trips for three days of bad weather). Writes plain tour_availability rows,
// so the existing booking functions enforce them with no other change.
export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  if (process.env.VERCEL_ENV === "preview") return json({ error: "Administration changes are disabled in this preview until an isolated test database is configured." }, 503);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await hasLivePermission(supabase, user, "operations"))) return json({ error: "Unauthorized" }, 401);

  const parsed = validateBulkAvailability(await request.json().catch(() => null));
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const input = parsed.value;
  const preview = request.nextUrl.searchParams.get("preview") === "1";

  const [{ data: existing, error: existingError }, { data: bookings, error: bookingError }] = await Promise.all([
    supabase.from("tour_availability").select("id,tour_slug,service_date,start_time,capacity,reserved,blocked").in("tour_slug", input.tourSlugs).gte("service_date", input.from).lte("service_date", input.to).limit(50_000),
    supabase.from("bookings").select("tour_slug,date,guests").in("tour_slug", input.tourSlugs).gte("date", input.from).lte("date", input.to).neq("status", "cancelled").limit(50_000),
  ]);
  if (existingError || bookingError) return json({ error: (existingError || bookingError)!.message }, 500);

  const plan = planBulkAvailability(input, existing || [], bookings || []);
  const summary = { updated: plan.updates.length, created: plan.inserts.length, overbooked: plan.overbooked.slice(0, 50), overbookedCount: plan.overbooked.length };
  if (preview) return json({ preview: true, ...summary });

  // Group identical patches so each distinct change is one update statement.
  const byPatch = new Map<string, { patch: Record<string, unknown>; ids: string[] }>();
  for (const update of plan.updates) {
    const key = JSON.stringify({ ...update.patch, updated_at: undefined });
    const entry = byPatch.get(key) || { patch: update.patch, ids: [] };
    entry.ids.push(update.id);
    byPatch.set(key, entry);
  }
  for (const { patch, ids } of byPatch.values()) {
    for (let index = 0; index < ids.length; index += 500) {
      const { error } = await supabase.from("tour_availability").update(patch).in("id", ids.slice(index, index + 500));
      if (error) return json({ error: error.message }, 500);
    }
  }
  for (let index = 0; index < plan.inserts.length; index += 500) {
    const { error } = await supabase.from("tour_availability").insert(plan.inserts.slice(index, index + 500));
    if (error) return json({ error: error.message }, 500);
  }
  const label = input.action === "capacity" ? `capacity ${input.capacity ?? "unlimited"}` : input.action === "close" ? "closed" : "reopened";
  await supabase.rpc("record_admin_audit", {
    action_name: "bulk_update",
    resource_name: "availability",
    resource_identifier: input.tourSlugs.join(",").slice(0, 200),
    summary_text: `Availability ${label} for ${input.tourSlugs.length} tour(s), ${input.from} to ${input.to}`,
    after_value: { ...input, ...summary },
  });
  return json({ ok: true, ...summary });
}
