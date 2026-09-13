import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthorization } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createRequiredAdminClient } from "@/utils/supabase/admin";
import { validatePromoDefinition } from "@/lib/promo-codes";
import { tours } from "@/data/tours";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
export async function GET() {
  const auth = await getAdminAuthorization("content");
  if (!auth.allowed) return json({ error: "Unauthorized" }, auth.user ? 403 : 401);
  const { data, error } = await createRequiredAdminClient().from("promo_codes").select("*").order("created_at", { ascending: false }).limit(201);
  if (error) return json({ error: "Promo codes are unavailable. Check that the database migration is installed." }, 503);
  return json({ codes: data.slice(0, 200), truncated: data.length > 200 });
}
export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  if (process.env.VERCEL_ENV === "preview") return json({ error: "Changes are disabled in preview." }, 503);
  const auth = await getAdminAuthorization("content");
  if (!auth.allowed) return json({ error: "Unauthorized" }, auth.user ? 403 : 401);
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Invalid request." }, 400);
    const record = validatePromoDefinition(body);
    if (record.tour_slug && !tours.some(t => t.slug === record.tour_slug)) return json({ error: "Choose a valid trip." }, 400);
    const { data, error } = await createRequiredAdminClient().from("promo_codes").insert(record).select().single();
    if (error) return json({ error: error.code === "23505" ? "This promo code already exists." : "Could not save promo code." }, 400);
    await auth.supabase.rpc("record_admin_audit", { action_name: "create", resource_name: "promo_codes", resource_identifier: data.id, summary_text: `Created promo code ${record.code}`, after_value: data });
    return json({ code: data }, 201);
  } catch (error) { return json({ error: error instanceof Error ? error.message : "Invalid promo code." }, 400); }
}
export async function PATCH(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  if (process.env.VERCEL_ENV === "preview") return json({ error: "Changes are disabled in preview." }, 503);
  const auth = await getAdminAuthorization("content");
  if (!auth.allowed) return json({ error: "Unauthorized" }, auth.user ? 403 : 401);
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "string" || typeof body.active !== "boolean") return json({ error: "Choose a promo code and its status." }, 400);
  const { data, error } = await createRequiredAdminClient().from("promo_codes").update({ active: body.active }).eq("id", body.id).select().single();
  if (error) return json({ error: "Could not update promo code." }, 400);
  await auth.supabase.rpc("record_admin_audit", { action_name: "update", resource_name: "promo_codes", resource_identifier: data.id, summary_text: `${body.active ? "Enabled" : "Disabled"} promo code ${data.code}`, after_value: data });
  return json({ code: data });
}
