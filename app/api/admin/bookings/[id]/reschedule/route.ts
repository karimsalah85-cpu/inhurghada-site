import { NextRequest, NextResponse } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import { getCustomerVisibleAssignment } from "@/lib/booking-assignment";
import { bookingTrips, isClockTime, isIsoDate } from "@/lib/booking-reschedule";
import { sendBookingAndPaymentStatusNotification } from "@/lib/booking-status-notification";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createClient } from "@/utils/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const hhmm = (value: unknown) => (typeof value === "string" ? value.slice(0, 5) : null);

/** Database errors raised by admin_reschedule_booking that are safe to show to staff. */
const rescheduleErrorStatus: Record<string, number> = { P0001: 409, P0002: 404, "22023": 400, "42501": 403 };

/**
 * Moves a booking (or one trip of a multi-trip booking) to another date and,
 * when asked, emails the customer the updated booking with its PDF.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return json({ error: "Invalid booking identifier." }, 400);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!(await hasLivePermission(supabase, user, "bookings"))) return json({ error: "Unauthorized." }, 401);

  const body = await request.json().catch(() => null) as { date?: unknown; start_time?: unknown; trip_index?: unknown; notify?: unknown } | null;
  if (!isIsoDate(body?.date)) return json({ error: "Choose a valid date." }, 400);
  const startTime = body.start_time == null || body.start_time === "" ? null : body.start_time;
  if (startTime !== null && !isClockTime(startTime)) return json({ error: "Enter the time as HH:MM." }, 400);
  const tripIndex = body.trip_index == null ? null : body.trip_index;
  if (tripIndex !== null && (!Number.isInteger(tripIndex) || (tripIndex as number) < 0 || (tripIndex as number) > 50)) return json({ error: "Choose a valid trip." }, 400);

  const { data: existing, error: readError } = await supabase.from("bookings").select("*").eq("id", id).single();
  if (readError || !existing) return json({ error: "Booking not found." }, 404);
  const tripsBefore = bookingTrips(existing);
  const trip = tripsBefore[(tripIndex as number | null) ?? 0];
  if (!trip) return json({ error: "Trip not found on this booking." }, 400);

  const { data, error } = await supabase.rpc("admin_reschedule_booking", {
    p_booking_id: id,
    p_date: body.date,
    p_start_time: startTime,
    p_trip_index: tripIndex,
  });
  if (error || !data) {
    const status = rescheduleErrorStatus[error?.code || ""];
    if (!status) console.error("Booking reschedule failed", { id, code: error?.code, message: error?.message });
    return json({ error: status ? error?.message : "Could not change the booking date." }, status || 500);
  }
  const booking = (Array.isArray(data) ? data[0] : data) as typeof existing;

  const dateChanged = trip.date !== body.date;
  const timeChanged = hhmm(existing.start_time) !== hhmm(booking.start_time);
  if (!dateChanged && !timeChanged) {
    return json({ booking, changed: false, notification: { attempted: false, sent: false }, supplierRequests: 0 });
  }

  await supabase.rpc("record_admin_audit", {
    action_name: "update",
    resource_name: "booking",
    resource_identifier: id,
    summary_text: `Rescheduled booking ${booking.reference || id}${tripsBefore.length > 1 ? ` (${trip.name})` : ""} from ${trip.date || "no date"} to ${body.date}`,
    before_value: existing,
    after_value: { ...booking, actor: user?.email },
  });

  // Suppliers already holding the old date need the request resent by staff.
  const { count: supplierRequests } = await supabase.from("supplier_booking_requests")
    .select("id", { count: "exact", head: true }).eq("booking_id", id).in("status", ["sent", "confirmed", "change_requested"]);

  // Completed trips get the thank-you email instead, and a cancelled booking has nothing to reconfirm.
  const canNotify = body.notify === true && Boolean(booking.customer_email) && ["new", "confirmed"].includes(String(booking.status));
  let notification: { attempted: boolean; sent: boolean; reason?: string } = { attempted: false, sent: false };
  if (canNotify) {
    const assignment = await getCustomerVisibleAssignment(supabase, id);
    const result = await sendBookingAndPaymentStatusNotification({
      ...booking,
      ...assignment,
      dateChange: dateChanged ? { from: trip.date, to: body.date, tripName: tripsBefore.length > 1 ? trip.name : null } : null,
    }).catch((reason: unknown) => {
      console.error("Reschedule email failed", { reference: booking.reference, message: reason instanceof Error ? reason.message : String(reason) });
      return { success: false, reason: "delivery-failed" };
    });
    notification = { attempted: true, sent: result.success, reason: "reason" in result && result.reason ? String(result.reason) : undefined };
  }

  return json({ booking, changed: true, notification, supplierRequests: supplierRequests || 0 });
}
