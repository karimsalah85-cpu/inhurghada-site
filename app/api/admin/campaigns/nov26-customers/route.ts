import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthorization } from "@/lib/admin-permission";
import { isAdminOwner } from "@/lib/admin-auth";
import { sendBookingEmail } from "@/lib/booking-service";
import { buildNov26Audience, NOV26_CAMPAIGN, nov26Subjects, renderNov26, type CampaignBooking, type Nov26Variant } from "@/lib/campaigns/nov26-customers";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createRequiredAdminClient } from "@/utils/supabase/admin";

export const maxDuration = 120;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const testInbox = "info@dailyredsea.com";

/** One-off, owner-only send. mode: preview (lists only), test (info@ only), send (customers; needs expectedCount). Remove after the campaign. */
export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  if (process.env.VERCEL_ENV === "preview") return json({ error: "Disabled in preview." }, 503);
  const auth = await getAdminAuthorization("edit_bookings");
  if (!auth.allowed || !isAdminOwner(auth.user)) return json({ error: "Unauthorized" }, auth.user ? 403 : 401);
  const input = await request.json().catch(() => null) as { mode?: string; expectedCount?: number } | null;
  const mode = input?.mode;
  if (mode !== "preview" && mode !== "test" && mode !== "send") return json({ error: "Choose preview, test or send." }, 400);

  if (mode === "test") {
    const variants: Nov26Variant[] = ["egypt", "egyptApology", "jeddah"];
    const results = [];
    for (const variant of variants) {
      const result = await sendBookingEmail(testInbox, `[TEST] ${nov26Subjects[variant]}`, renderNov26(variant, "Karim"), undefined, { bcc: false });
      results.push({ variant, success: result.success });
    }
    return json({ mode, results });
  }

  const db = createRequiredAdminClient();
  const { data: bookings, error } = await db.from("bookings").select("id,customer_name,customer_email,tour_name,tour_slug,cancellation_note,archived_at,created_at");
  if (error) return json({ error: "Could not load bookings." }, 503);
  const audience = buildNov26Audience(bookings as CampaignBooking[]);
  const { data: logged, error: logError } = await db.from("communication_messages").select("recipient,delivery_status").eq("metadata->>campaign", NOV26_CAMPAIGN);
  if (logError) return json({ error: "Could not read the send log." }, 503);
  const done = new Set((logged ?? []).filter(row => row.delivery_status !== "failed").map(row => row.recipient));
  const pending = audience.filter(recipient => !done.has(recipient.email));
  if (mode === "preview") return json({ mode, total: audience.length, alreadySent: audience.length - pending.length, pending: pending.map(({ email, firstName, variant }) => ({ email, firstName, variant })) });
  if (input?.expectedCount !== pending.length) return json({ error: `Expected ${input?.expectedCount}, but ${pending.length} are pending. Nothing was sent.` }, 409);

  const results = [];
  for (const recipient of pending) {
    const subject = nov26Subjects[recipient.variant];
    const { data: row, error: claimError } = await db.from("communication_messages").insert({ booking_id: recipient.bookingId, customer_key: recipient.email, channel: "email", direction: "outbound", recipient: recipient.email, sender: testInbox, subject, body: `Marketing campaign ${NOV26_CAMPAIGN} (${recipient.variant})`, delivery_status: "pending", metadata: { campaign: NOV26_CAMPAIGN, variant: recipient.variant } }).select("id").single();
    if (claimError || !row) { results.push({ email: recipient.email, success: false }); continue; }
    const result = await sendBookingEmail(recipient.email, subject, renderNov26(recipient.variant, recipient.firstName), undefined, { bcc: false });
    await db.from("communication_messages").update({ delivery_status: result.success ? "sent" : "failed" }).eq("id", row.id);
    results.push({ email: recipient.email, success: result.success });
  }
  await auth.supabase.rpc("record_admin_audit", { action_name: "create", resource_name: "communication_messages", resource_identifier: NOV26_CAMPAIGN, summary_text: `Sent ${NOV26_CAMPAIGN}: ${results.filter(r => r.success).length} of ${results.length}` });
  return json({ mode, results });
}
