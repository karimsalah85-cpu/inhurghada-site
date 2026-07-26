import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createClient } from "@/utils/supabase/server";
import { sendBookingStatusNotification } from "@/lib/booking-status-notification";

const bookingStatuses = new Set(["new", "confirmed", "completed", "cancelled"]);
const paymentStatuses = new Set(["unpaid", "paid", "refunded"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function PATCH(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) return json({ error: "Unauthorized." }, 401);

  const body = await request.json().catch(() => null) as { ids?: unknown; status?: unknown; payment_status?: unknown } | null;
  const ids = Array.isArray(body?.ids) ? [...new Set(body.ids.filter((id): id is string => typeof id === "string" && uuidPattern.test(id)))] : [];
  if (!ids.length || ids.length > 100 || ids.length !== (body?.ids as unknown[])?.length) return json({ error: "Select between 1 and 100 valid bookings." }, 400);

  const update: { status?: string; payment_status?: string } = {};
  if (typeof body?.status === "string" && bookingStatuses.has(body.status)) update.status = body.status;
  if (typeof body?.payment_status === "string" && paymentStatuses.has(body.payment_status)) update.payment_status = body.payment_status;
  if (!Object.keys(update).length) return json({ error: "Choose a valid group action." }, 400);

  const { data: existing, error: readError } = update.status
    ? await supabase.from("bookings").select("id,reference,customer_name,customer_email,tour_name,date,status").in("id", ids)
    : { data: [], error: null };
  if (readError) return json({ error: "Could not prepare customer notifications." }, 500);
  const { data, error } = await supabase.from("bookings").update(update).in("id", ids).select();
  if (error) return json({ error: "Could not update the selected bookings." }, 500);
  const changed = (existing || []).filter((booking) => update.status && booking.status !== update.status);
  const notifications = await Promise.all(changed.map((booking) => sendBookingStatusNotification(booking, update.status!)));
  return json({
    bookings: data || [],
    updated: data?.length || 0,
    notifications: { attempted: notifications.length, sent: notifications.filter((item) => item.success).length },
  });
}
