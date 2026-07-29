import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createClient } from "@/utils/supabase/server";

const bookingStatuses = new Set(["new", "confirmed", "completed", "cancelled"]);
const paymentStatuses = new Set(["unpaid", "paid", "refunded"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

async function authorizedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return isAuthorizedAdmin(user) ? supabase : null;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return json({ error: "Invalid booking identifier." }, 400);
  const supabase = await authorizedClient();
  if (!supabase) return json({ error: "Unauthorized." }, 401);

  const body = await request.json().catch(() => null) as { status?: unknown; payment_status?: unknown } | null;
  const update: { status?: string; payment_status?: string } = {};
  if (typeof body?.status === "string" && bookingStatuses.has(body.status)) update.status = body.status;
  if (typeof body?.payment_status === "string" && paymentStatuses.has(body.payment_status)) update.payment_status = body.payment_status;
  if (!Object.keys(update).length) return json({ error: "Choose a valid booking or payment status." }, 400);

  const { data, error } = await supabase.from("bookings").update(update).eq("id", id).select().single();
  if (error) return json({ error: "Could not update the booking." }, 500);
  return json({ booking: data });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return json({ error: "Invalid booking identifier." }, 400);
  const supabase = await authorizedClient();
  if (!supabase) return json({ error: "Unauthorized." }, 401);
  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) return json({ error: "Could not delete the booking." }, 500);
  return json({ ok: true });
}
