import { NextRequest, NextResponse } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createClient } from "@/utils/supabase/server";
import { multiTripLoads, planBulkAvailability, validateBulkAvailability } from "@/lib/availability-bulk";
import { fetchAllPages } from "@/lib/supabase-paging";
import { tours } from "@/data/tours";

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

  // Multi-trip legs can fall up to two weeks after the booking's own (first-leg) date.
  const multiFrom = new Date(Date.parse(`${input.from}T00:00:00Z`) - 14 * 86_400_000).toISOString().slice(0, 10);
  const [existingResult, bookingResult, multiResult] = await Promise.all([
    fetchAllPages((from, to) => supabase.from("tour_availability").select("id,tour_slug,service_date,start_time,capacity,reserved,blocked").in("tour_slug", input.tourSlugs).gte("service_date", input.from).lte("service_date", input.to).order("id").range(from, to)),
    fetchAllPages((from, to) => supabase.from("bookings").select("tour_slug,date,guests").in("tour_slug", input.tourSlugs).gte("date", input.from).lte("date", input.to).neq("status", "cancelled").order("id").range(from, to)),
    fetchAllPages((from, to) => supabase.from("bookings").select("reference,pricing_snapshot").eq("tour_slug", "multi-trip").gte("date", multiFrom).lte("date", input.to).neq("status", "cancelled").order("id").range(from, to)),
  ]);
  const failed = existingResult.error || bookingResult.error || multiResult.error;
  if (failed) return json({ error: failed.message }, 500);
  const slugByTitle = new Map(tours.map((tour) => [tour.title.trim().toLowerCase(), tour.slug]));
  const multi = multiTripLoads((multiResult.data || []) as Array<{ reference: string; pricing_snapshot: unknown }>, slugByTitle, input);
  const wanted = new Set(input.tourSlugs);
  const loads = [...(bookingResult.data || []), ...multi.loads.filter((load) => load.tour_slug && wanted.has(load.tour_slug))];

  const plan = planBulkAvailability(input, existingResult.data || [], loads);
  const summary = { updated: plan.updates.length, created: plan.inserts.length, overbooked: plan.overbooked.slice(0, 50), overbookedCount: plan.overbooked.length, stillClosed: plan.stillClosed, unknownMultiTrip: multi.unknown.slice(0, 20) };
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
