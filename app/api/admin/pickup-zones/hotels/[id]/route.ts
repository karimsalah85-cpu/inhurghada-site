import type { NextRequest } from "next/server";
import { isUuid, validateHotel } from "@/lib/pickup-zones";
import { audit, dbError, hotelKeyClash, json, pickupZonesAccess } from "@/lib/pickup-zones-admin";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const access = await pickupZonesAccess(request, { write: true });
  if (!access.ok) return access.response;
  const { id } = await context.params;
  if (!isUuid(id)) return json({ error: "Hotel not found." }, 404);
  const parsed = validateHotel(await request.json().catch(() => null));
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const { data: before, error: readError } = await access.supabase.from("hotels").select("*").eq("id", id).maybeSingle();
  if (readError) return dbError(readError);
  if (!before) return json({ error: "Hotel not found." }, 404);
  const check = await hotelKeyClash(access.supabase, parsed.value, id);
  if (check.error) return dbError(check.error);
  if (check.clash) return json({ error: check.clash }, 409);
  const { data, error } = await access.supabase.from("hotels").update({ ...parsed.value, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) return dbError(error, "Another hotel already has this name.");
  await audit(access.supabase, "update", "hotels", id, `Updated hotel ${data.name}`, before, data);
  return json({ record: data });
}

export async function DELETE(request: NextRequest, context: Context) {
  const access = await pickupZonesAccess(request, { write: true });
  if (!access.ok) return access.response;
  const { id } = await context.params;
  if (!isUuid(id)) return json({ error: "Hotel not found." }, 404);
  const { data: before, error } = await access.supabase.from("hotels").delete().eq("id", id).select().maybeSingle();
  if (error) return dbError(error);
  if (!before) return json({ error: "Hotel not found." }, 404);
  await audit(access.supabase, "delete", "hotels", id, `Removed hotel ${before.name}`, before, null);
  return json({ ok: true });
}
