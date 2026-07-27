import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createClient } from "@/utils/supabase/server";
import { buildBookingAndPaymentStatusEmail, sendBookingAndPaymentStatusNotification } from "@/lib/booking-status-notification";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return json({ error: "Invalid booking identifier." }, 400);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) return json({ error: "Unauthorized." }, 401);

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("reference,customer_name,customer_email,tour_name,date,status,payment_status,amount,currency")
    .eq("id", id)
    .single();
  if (error || !booking) return json({ error: "Booking not found." }, 404);
  if (!booking.customer_email) return json({ error: "This customer does not have an email address." }, 400);

  const result = await sendBookingAndPaymentStatusNotification(booking);
  if (!result.success) {
    console.error("Manual customer status email failed", { reference: booking.reference, reason: "reason" in result ? result.reason : "delivery-failed" });
    const draft = buildBookingAndPaymentStatusEmail(booking);
    if (!draft) return json({ error: "The booking has an unsupported status." }, 400);
    const mailtoUrl = `mailto:${encodeURIComponent(booking.customer_email)}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.text)}`;
    return json({ sent: false, delivery: "draft", mailtoUrl, reference: booking.reference, recipient: booking.customer_email });
  }
  return json({ sent: true, delivery: "server", reference: booking.reference, recipient: booking.customer_email });
}
