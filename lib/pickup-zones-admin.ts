import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { hasLivePermission } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { buildHotelIndex, isMissingTableError, normalizeHotelName, PICKUP_ZONES_MIGRATION, type HotelRow } from "@/lib/pickup-zones";
import { createClient } from "@/utils/supabase/server";

export const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
export const migrationRequired = () => json({ configured: false, migration: PICKUP_ZONES_MIGRATION, error: `Database upgrade required — run ${PICKUP_ZONES_MIGRATION} in the Supabase SQL Editor.` }, 409);

type Access = { ok: true; supabase: SupabaseClient; user: User } | { ok: false; response: NextResponse };

/** Same checks as the control-center routes: origin and preview guard for writes, then the live operations permission. */
export async function pickupZonesAccess(request: NextRequest, { write }: { write: boolean }): Promise<Access> {
  if (write && !hasValidRequestOrigin(request)) return { ok: false, response: json({ error: "Invalid origin." }, 403) };
  if (write && process.env.VERCEL_ENV === "preview") return { ok: false, response: json({ error: "Administration changes are disabled in this preview until an isolated test database is configured." }, 503) };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAuthorizedAdmin(user)) return { ok: false, response: json({ error: "Unauthorized" }, 401) };
  if (!(await hasLivePermission(supabase, user, "operations"))) return { ok: false, response: json({ error: "Your role cannot manage hotels and pickup times." }, 403) };
  return { ok: true, supabase, user };
}

/** Database error → response. Missing tables become the "database upgrade required" answer. */
export function dbError(error: { code?: string | null; message: string }, duplicate = "That name is already used.") {
  if (isMissingTableError(error)) return migrationRequired();
  if (error.code === "23505") return json({ error: duplicate }, 409);
  if (error.code === "23503") return json({ error: "The chosen pickup zone no longer exists." }, 400);
  return json({ error: error.message }, 500);
}

/**
 * A hotel's name and aliases must not already point at a different hotel, or matching would be
 * ambiguous. Returns the clashing hotel's name, or null when the keys are free.
 */
export async function hotelKeyClash(supabase: SupabaseClient, keys: { name: string; aliases: string[] }, excludeId?: string) {
  const { data, error } = await supabase.from("hotels").select("id,name,normalized_name,aliases,zone_id,active").limit(10_000);
  if (error) return { error };
  const others = ((data || []) as HotelRow[]).filter((hotel) => hotel.id !== excludeId);
  const index = buildHotelIndex(others);
  for (const text of [keys.name, ...keys.aliases]) {
    const clash = index.exact.get(normalizeHotelName(text));
    if (clash) return { clash: `"${text}" already matches ${clash.name}.` };
  }
  return {};
}

export async function audit(supabase: SupabaseClient, action: string, resource: string, id: string, summary: string, before: unknown, after: unknown) {
  await supabase.rpc("record_admin_audit", { action_name: action, resource_name: resource, resource_identifier: id, summary_text: summary, before_value: before ?? null, after_value: after ?? null });
}
