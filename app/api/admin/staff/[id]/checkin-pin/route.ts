import { NextRequest, NextResponse } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import { issuePin } from "@/lib/guide-checkin";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

async function authorize(request: NextRequest, id: string) {
  if (!hasValidRequestOrigin(request)) return { response: json({ error: "Invalid origin." }, 403) };
  if (!uuidPattern.test(id)) return { response: json({ error: "Invalid staff identifier." }, 400) };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!(await hasLivePermission(supabase, user, "operations"))) return { response: json({ error: "Your role cannot manage staff check-in PINs." }, 403) };
  const database = createAdminClient();
  if (!database) return { response: json({ error: "Database is not configured." }, 503) };
  const { data: staff } = await database.from("staff_members").select("id,name,active").eq("id", id).maybeSingle();
  if (!staff) return { response: json({ error: "Staff member not found." }, 404) };
  return { supabase, database, staff };
}

/** Generates a new PIN (shown once) and signs this person out of any phone using the old one. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = await authorize(request, id);
  if ("response" in auth) return auth.response;
  if (!auth.staff.active) return json({ error: "Reactivate this staff member before issuing a PIN." }, 409);
  let pin: string;
  try { pin = await issuePin(auth.database, id); }
  catch (error) { return json({ error: (error as Error).message }, 503); }
  await auth.supabase.rpc("record_admin_audit", { action_name: "update", resource_name: "staff_checkin_pin", resource_identifier: id, summary_text: `Issued a new check-in PIN for ${auth.staff.name}`, before_value: null, after_value: null });
  return json({ pin, name: auth.staff.name });
}

/** Removes the PIN; that person can no longer check guests in. */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = await authorize(request, id);
  if ("response" in auth) return auth.response;
  const { error } = await auth.database.from("staff_checkin_pins").delete().eq("staff_member_id", id);
  if (error) return json({ error: error.message }, 503);
  await auth.supabase.rpc("record_admin_audit", { action_name: "delete", resource_name: "staff_checkin_pin", resource_identifier: id, summary_text: `Removed the check-in PIN for ${auth.staff.name}`, before_value: null, after_value: null });
  return json({ removed: true });
}
