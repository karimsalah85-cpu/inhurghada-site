import type { NextRequest } from "next/server";
import { isUuid, validateZone } from "@/lib/pickup-zones";
import { audit, dbError, json, pickupZonesAccess } from "@/lib/pickup-zones-admin";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const access = await pickupZonesAccess(request, { write: true });
  if (!access.ok) return access.response;
  const { id } = await context.params;
  if (!isUuid(id)) return json({ error: "Zone not found." }, 404);
  const parsed = validateZone(await request.json().catch(() => null));
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const { data: before, error: readError } = await access.supabase.from("pickup_zones").select("*").eq("id", id).maybeSingle();
  if (readError) return dbError(readError);
  if (!before) return json({ error: "Zone not found." }, 404);
  const { data, error } = await access.supabase.from("pickup_zones").update({ ...parsed.value, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) return dbError(error, "A zone with this name already exists.");
  await audit(access.supabase, "update", "pickup_zones", id, `Updated pickup zone ${data.name}`, before, data);
  return json({ record: data });
}

// Deleting a zone removes its pickup times (cascade) and leaves its hotels without a zone.
export async function DELETE(request: NextRequest, context: Context) {
  const access = await pickupZonesAccess(request, { write: true });
  if (!access.ok) return access.response;
  const { id } = await context.params;
  if (!isUuid(id)) return json({ error: "Zone not found." }, 404);
  const { data: before, error } = await access.supabase.from("pickup_zones").delete().eq("id", id).select().maybeSingle();
  if (error) return dbError(error);
  if (!before) return json({ error: "Zone not found." }, 404);
  await audit(access.supabase, "delete", "pickup_zones", id, `Deleted pickup zone ${before.name}`, before, null);
  return json({ ok: true });
}
