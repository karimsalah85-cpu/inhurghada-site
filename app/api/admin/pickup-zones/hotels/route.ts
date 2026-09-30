import type { NextRequest } from "next/server";
import { validateHotel } from "@/lib/pickup-zones";
import { audit, dbError, hotelKeyClash, json, pickupZonesAccess } from "@/lib/pickup-zones-admin";

export async function POST(request: NextRequest) {
  const access = await pickupZonesAccess(request, { write: true });
  if (!access.ok) return access.response;
  const parsed = validateHotel(await request.json().catch(() => null));
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const check = await hotelKeyClash(access.supabase, parsed.value);
  if (check.error) return dbError(check.error);
  if (check.clash) return json({ error: `${check.clash} Add it as an alias there instead.` }, 409);
  const { data, error } = await access.supabase.from("hotels").insert(parsed.value).select().single();
  if (error) return dbError(error, "This hotel is already on the list.");
  await audit(access.supabase, "create", "hotels", data.id, `Added hotel ${data.name}`, null, data);
  return json({ record: data }, 201);
}
