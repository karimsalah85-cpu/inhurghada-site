import type { NextRequest } from "next/server";
import { validateZone } from "@/lib/pickup-zones";
import { audit, dbError, json, pickupZonesAccess } from "@/lib/pickup-zones-admin";

export async function POST(request: NextRequest) {
  const access = await pickupZonesAccess(request, { write: true });
  if (!access.ok) return access.response;
  const parsed = validateZone(await request.json().catch(() => null));
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const { data, error } = await access.supabase.from("pickup_zones").insert(parsed.value).select().single();
  if (error) return dbError(error, "A zone with this name already exists.");
  await audit(access.supabase, "create", "pickup_zones", data.id, `Created pickup zone ${data.name}`, null, data);
  return json({ record: data }, 201);
}
