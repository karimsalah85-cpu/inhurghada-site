import { NextRequest, NextResponse } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createClient } from "@/utils/supabase/server";
import { sendBookingAndPaymentStatusNotification } from "@/lib/booking-status-notification";
import { getCustomerVisibleAssignment } from "@/lib/booking-assignment";

const bookingStatuses = new Set(["new", "confirmed", "completed", "cancelled"]);
const paymentStatuses = new Set(["unpaid", "paid", "refunded"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

async function authorizedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (await hasLivePermission(supabase, user, "bookings")) ? { supabase, user } : null;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return json({ error: "Invalid booking identifier." }, 400);
  const authorized = await authorizedClient();
  if (!authorized) return json({ error: "Unauthorized." }, 401);
  const { supabase, user } = authorized;

  const body = await request.json().catch(() => null) as { status?: unknown; payment_status?: unknown; sales_person_id?: unknown; archived?: unknown } | null;
  const update: { status?: string; payment_status?: string; sales_person_id?: string | null; sales_commission_percent?: number | null; archived_at?: string | null } = {};
  if (typeof body?.status === "string" && bookingStatuses.has(body.status)) update.status = body.status;
  if (typeof body?.payment_status === "string" && paymentStatuses.has(body.payment_status)) update.payment_status = body.payment_status;
  if (typeof body?.archived === "boolean") update.archived_at = body.archived ? new Date().toISOString() : null;
  if (body && Object.hasOwn(body, "sales_person_id")) {
    if (body.sales_person_id === null || body.sales_person_id === "") {
      update.sales_person_id = null;
      update.sales_commission_percent = null;
    } else if (typeof body.sales_person_id === "string" && uuidPattern.test(body.sales_person_id)) {
      const { data: salesPerson, error: salesError } = await supabase.from("sales_people").select("id,commission_percent").eq("id", body.sales_person_id).single();
      if (salesError || !salesPerson) return json({ error: "Sales person not found." }, 404);
      update.sales_person_id = salesPerson.id;
      update.sales_commission_percent = salesPerson.commission_percent == null ? 0 : Number(salesPerson.commission_percent);
    } else return json({ error: "Choose a valid sales person." }, 400);
  }
  if (!Object.keys(update).length) return json({ error: "Choose a valid booking update." }, 400);

  const { data: existing, error: readError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();
  if (readError || !existing) return json({ error: "Booking not found." }, 404);

  const { data, error } = await supabase.from("bookings").update(update).eq("id", id).select().single();
  if (error) return json({ error: "Could not update the booking." }, 500);
  await supabase.rpc("record_admin_audit", { action_name: "update", resource_name: "booking", resource_identifier: id, summary_text: `Updated booking ${data.reference || id}`, before_value: existing, after_value: { ...data, actor: user?.email } });
  const changed = (update.status && update.status !== existing.status)
    || (update.payment_status && update.payment_status !== existing.payment_status);
  const customerAssignment = changed ? await getCustomerVisibleAssignment(supabase, id) : {};
  const notification = changed ? await sendBookingAndPaymentStatusNotification({ ...data, ...customerAssignment }) : null;
  return json({
    booking: data,
    notification: notification
      ? { attempted: true, sent: notification.success, reason: "reason" in notification ? notification.reason : undefined }
      : { attempted: false, sent: false },
  });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return json({ error: "Invalid booking identifier." }, 400);
  const authorized = await authorizedClient();
  if (!authorized) return json({ error: "Unauthorized." }, 401);
  const { supabase, user } = authorized;
  const { data: existing } = await supabase.from("bookings").select("*").eq("id", id).single();
  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) return json({ error: "Could not delete the booking." }, 500);
  await supabase.rpc("record_admin_audit", { action_name: "delete", resource_name: "booking", resource_identifier: id, summary_text: `Deleted booking ${existing?.reference || id}`, before_value: existing ? { ...existing, actor: user?.email } : { actor: user?.email }, after_value: null });
  return json({ ok: true });
}
