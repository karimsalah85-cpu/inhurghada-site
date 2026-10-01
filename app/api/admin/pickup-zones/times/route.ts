import type { NextRequest } from "next/server";
import { validateZoneTime } from "@/lib/pickup-zones";
import { audit, dbError, json, pickupZonesAccess } from "@/lib/pickup-zones-admin";
import { pickupTourSlugs } from "@/lib/pickup-zone-tours";

// Sets (or, with an empty time, clears) the standard pickup time for one zone and tour.
export async function PUT(request: NextRequest) {
  const access = await pickupZonesAccess(request, { write: true });
  if (!access.ok) return access.response;
  const parsed = validateZoneTime(await request.json().catch(() => null), pickupTourSlugs);
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const { zone_id, tour_slug, pickup_time } = parsed.value;
  const { supabase } = access;
  const { data: before, error: readError } = await supabase.from("zone_pickup_times").select("*").eq("zone_id", zone_id).eq("tour_slug", tour_slug).maybeSingle();
  if (readError) return dbError(readError);
  const identifier = `${zone_id}:${tour_slug}`;
  if (!pickup_time) {
    if (!before) return json({ record: null });
    const { error } = await supabase.from("zone_pickup_times").delete().eq("zone_id", zone_id).eq("tour_slug", tour_slug);
    if (error) return dbError(error);
    await audit(supabase, "delete", "zone_pickup_times", identifier, `Cleared pickup time for ${tour_slug}`, before, null);
    return json({ record: null });
  }
  const { data, error } = await supabase.from("zone_pickup_times")
    .upsert({ zone_id, tour_slug, pickup_time, updated_at: new Date().toISOString() }, { onConflict: "zone_id,tour_slug" })
    .select("zone_id,tour_slug,pickup_time").single();
  if (error) return dbError(error);
  await audit(supabase, before ? "update" : "create", "zone_pickup_times", identifier, `Pickup time for ${tour_slug} set to ${pickup_time}`, before, data);
  return json({ record: data });
}
