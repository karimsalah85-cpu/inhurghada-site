import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createClient } from "@/utils/supabase/server";
import { sendBookingAndPaymentStatusNotification } from "@/lib/booking-status-notification";
import { getCustomerVisibleAssignment } from "@/lib/booking-assignment";

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
    .select("reference,customer_name,customer_email,phone,tour_name,date,guests,hotel,status,payment_status,amount,currency")
    .eq("id", id)
    .single();
  if (error || !booking) return json({ error: "Booking not found." }, 404);
  if (!booking.customer_email) return json({ error: "This customer does not have an email address." }, 400);

  const assignment = await getCustomerVisibleAssignment(supabase, id);
  const result = await sendBookingAndPaymentStatusNotification({ ...booking, ...assignment });
  if (!result.success) {
    console.error("Manual customer status email failed", { reference: booking.reference, reason: "reason" in result ? result.reason : "delivery-failed" });
    const reason = ("reason" in result && result.reason) ? result.reason : "delivery-failed";
    const errorMessage = {
      "missing-email-config": "Automatic email is not configured. Add GMAIL_SMTP_APP_PASSWORD to the production environment and redeploy.",
      "gmail-auth-failed": "Google rejected the email login. Create a new App Password while signed in as info@dailyredsea.com, update GMAIL_SMTP_APP_PASSWORD, and redeploy.",
      "gmail-connection-failed": "The website could not connect to Gmail. Try again shortly or configure a verified Resend API key.",
      "gmail-smtp-failed": "Gmail could not send the message. Check the server deployment logs for the SMTP error.",
    }[reason] || "The status email and PDF could not be delivered. Check the email service and try again.";
    return json({ error: errorMessage, reason }, 503);
  }
  return json({ sent: true, reference: booking.reference, recipient: booking.customer_email });
}
