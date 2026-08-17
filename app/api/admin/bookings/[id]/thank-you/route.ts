import { NextRequest, NextResponse } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import { buildThankYouEmail } from "@/lib/booking-communications-i18n";
import { sendBookingEmail } from "@/lib/booking-service";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createClient } from "@/utils/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return json({ error: "Invalid booking identifier." }, 400);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!(await hasLivePermission(supabase, user, "bookings"))) return json({ error: "Unauthorized." }, 401);
  const { data: booking, error } = await supabase.from("bookings").select("reference,customer_name,customer_email,tour_name,status,locale").eq("id", id).single();
  if (error || !booking) return json({ error: "Booking not found." }, 404);
  if (booking.status !== "completed") return json({ error: "Mark the trip as completed before sending a thank-you email." }, 409);
  if (!booking.customer_email) return json({ error: "This customer does not have an email address." }, 400);
  const email = buildThankYouEmail({ locale: booking.locale, customerName: booking.customer_name, reference: booking.reference, tourName: booking.tour_name });
  const result = await sendBookingEmail(booking.customer_email, email.subject, email.html);
  if (!result.success) return json({ error: "The thank-you email could not be delivered.", reason: result.reason }, 503);
  await supabase.rpc("record_admin_audit", { action_name: "send", resource_name: "booking_thank_you_email", resource_identifier: id, summary_text: `Sent thank-you email for ${booking.reference}`, before_value: null, after_value: { recipient: booking.customer_email, locale: booking.locale, actor: user?.email } });
  return json({ sent: true, recipient: booking.customer_email });
}
