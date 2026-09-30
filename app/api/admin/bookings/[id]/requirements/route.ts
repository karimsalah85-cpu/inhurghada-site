import { NextRequest, NextResponse } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { validateGuestRequirements } from "@/lib/guest-requirements";
import { createClient } from "@/utils/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const missingColumn = (code: string | undefined) => ["42703", "PGRST204"].includes(code || "");

/**
 * Replaces a booking's guest requirements (non-swimmers, medical, dietary,
 * diving certification). The whole object is sent each time; empty fields are
 * dropped by the validator.
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  if (process.env.VERCEL_ENV === "preview") return json({ error: "Administration changes are disabled in this preview until an isolated test database is configured." }, 503);
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return json({ error: "Invalid booking identifier." }, 400);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !((await hasLivePermission(supabase, user, "bookings")) || (await hasLivePermission(supabase, user, "operations")))) {
    return json({ error: "Unauthorized." }, 401);
  }

  const body = await request.json().catch(() => null) as { guest_requirements?: unknown } | null;
  const parsed = validateGuestRequirements(body?.guest_requirements);
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  const { data: existing, error: readError } = await supabase.from("bookings").select("id,reference,guest_requirements").eq("id", id).maybeSingle();
  if (readError && missingColumn(readError.code)) return json({ error: "Database upgrade pending: apply the guest requirements migration first.", pending: true }, 503);
  if (readError || !existing) return json({ error: "Booking not found." }, 404);

  const { data, error } = await supabase.from("bookings").update({ guest_requirements: parsed.value }).eq("id", id).select("id,reference,guest_requirements").single();
  if (error) {
    if (missingColumn(error.code)) return json({ error: "Database upgrade pending: apply the guest requirements migration first.", pending: true }, 503);
    return json({ error: "Could not save the guest requirements." }, 500);
  }
  await supabase.rpc("record_admin_audit", {
    action_name: "update",
    resource_name: "booking_guest_requirements",
    resource_identifier: id,
    summary_text: `Updated guest requirements on booking ${data.reference || id}`,
    before_value: { guest_requirements: existing.guest_requirements },
    after_value: { guest_requirements: data.guest_requirements, actor: user.email },
  });
  return json({ guest_requirements: data.guest_requirements });
}
