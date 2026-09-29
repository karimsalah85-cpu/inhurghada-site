import { NextRequest, NextResponse } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { cancellationSchema, firstIssue } from "@/lib/finance/schemas";
import { createClient } from "@/utils/supabase/server";
import { sendBookingAndPaymentStatusNotification } from "@/lib/booking-status-notification";
import { deliverReferralNotifications } from "@/lib/referral-notifications";
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

  const body = await request.json().catch(() => null) as { status?: unknown; payment_status?: unknown; sales_person_id?: unknown; archived?: unknown; cancellation_reason?: unknown; cancellation_note?: unknown } | null;
  const update: { status?: string; payment_status?: string; sales_person_id?: string | null; sales_commission_percent?: number | null; archived_at?: string | null; cancellation_reason?: string; cancellation_note?: string | null } = {};
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
  if (body && (Object.hasOwn(body, "cancellation_reason") || Object.hasOwn(body, "cancellation_note"))) {
    const cancellation = cancellationSchema.safeParse(body);
    if (!cancellation.success) return json({ error: firstIssue(cancellation.error) }, 400);
    update.cancellation_reason = cancellation.data.cancellation_reason;
    update.cancellation_note = cancellation.data.cancellation_note;
  }
  if (!Object.keys(update).length) return json({ error: "Choose a valid booking update." }, 400);

  const { data: existing, error: readError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();
  if (readError || !existing) return json({ error: "Booking not found." }, 404);
  if (update.cancellation_reason && (update.status ?? existing.status) !== "cancelled") {
    return json({ error: "A cancellation reason can only be set on a cancelled booking." }, 400);
  }

  const { data, error } = await supabase.from("bookings").update(update).eq("id", id).select().single();
  if (error) return json({ error: "Could not update the booking." }, 500);
  await supabase.rpc("record_admin_audit", { action_name: "update", resource_name: "booking", resource_identifier: id, summary_text: `Updated booking ${data.reference || id}`, before_value: existing, after_value: { ...data, actor: user?.email } });
  const changed = (update.status && update.status !== existing.status)
    || (update.payment_status && update.payment_status !== existing.payment_status);
  // Reward and completion events are posted atomically by the booking database trigger.
  // Delivery is retryable through the existing cron if the email provider is unavailable.
  if (changed) await deliverReferralNotifications().catch(error => console.error("Referral notification delivery deferred", error.message));
  const customerAssignment = changed ? await getCustomerVisibleAssignment(supabase, id) : {};
  const notification = changed && data.status !== "completed" ? await sendBookingAndPaymentStatusNotification({ ...data, ...customerAssignment }) : null;
  return json({
    booking: data,
    notification: notification
      ? { attempted: true, sent: notification.success, reason: "reason" in notification ? notification.reason : undefined }
      : { attempted: false, sent: false },
  });
}

// Bookings are archived (PATCH { archived: true }) or cancelled, never deleted:
// their financial history must stay intact.
export async function DELETE() {
  return json({ error: "Bookings are never deleted. Archive or cancel the booking instead." }, 405);
}
