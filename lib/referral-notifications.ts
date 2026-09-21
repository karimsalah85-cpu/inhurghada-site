import "server-only";
import { createRequiredAdminClient } from "@/utils/supabase/admin";
import { sendBookingEmail } from "@/lib/booking-service";
import { buildReferralMessage } from "@/lib/referral-messages";

type Event = { id: string; customer_key: string; event_type: "trip_completed" | "activated" | "reward_earned"; booking_id: string | null; referral_id: string | null; processing_at: string; attempts: number };
/** Database outbox is independent of reward posting. Provider failures never roll back earned rewards. */
export async function deliverReferralNotifications() {
  const db = createRequiredAdminClient();
  const { data, error } = await db.rpc("claim_referral_notifications", { p_limit: 20 });
  if (error) throw new Error("Could not claim referral notifications.");
  let sent = 0, failed = 0;
  for (const event of (data || []) as Event[]) {
    try {
      let suppress = false;
      if (event.event_type === "activated") {
        const { data: completion, error: completionError } = await db.from("referral_notification_events").select("sent_at,created_at").eq("booking_id", event.booking_id).eq("event_type", "trip_completed").maybeSingle();
        if (completionError) throw new Error("completion-check-failed");
        // One combined message when payment and completion occur together. A later activation
        // is sent only when the earlier thank-you had already gone out before this event.
        suppress = Boolean(completion && (!completion.sent_at || completion.sent_at >= (event as Event & { created_at: string }).created_at));
      }
      if (event.event_type === "reward_earned") {
        const { data: referral, error: referralError } = await db.from("referrals").select("status").eq("id", event.referral_id).maybeSingle();
        if (referralError) throw new Error("reward-check-failed");
        suppress = referral?.status !== "qualified";
      }
      if (event.event_type === "trip_completed" || event.event_type === "activated") {
        const { data: source, error: sourceError } = await db.from("bookings").select("status,payment_status,referral_exclusion_reason").eq("id", event.booking_id).maybeSingle();
        if (sourceError) throw new Error("booking-check-failed");
        suppress ||= !source || source.status !== "completed" || Boolean(source.referral_exclusion_reason) || source.payment_status === "refunded";
      }
      if (suppress) {
        await db.from("referral_notification_events").update({ sent_at: new Date().toISOString(), processing_at: null, last_error: "suppressed-or-included-in-completion" }).eq("id", event.id).eq("processing_at", event.processing_at);
        continue;
      }
      const { data: identity, error: identityError } = await db.from("referral_identities").select("customer_email,customer_name,referral_code").eq("customer_key", event.customer_key).single();
      if (identityError || !identity?.customer_email) throw new Error("missing-recipient");
      const { data: account, error: accountError } = await db.rpc("referral_account", { p_customer_key: event.customer_key });
      if (accountError) throw new Error("account-unavailable");
      // Reward notifications use the referrer's own locale, not their friend's locale.
      const { data: booking } = await db.from("bookings").select("locale").ilike("customer_email", identity.customer_email).order("created_at", { ascending: false }).limit(1).maybeSingle();
      const message = buildReferralMessage({ event: event.event_type, customerName: identity.customer_name || "", locale: booking?.locale, qualified: Boolean(account?.qualified), referralCode: account?.referral_code, balanceUnits: Number(account?.balance_units || 0) });
      const result = await sendBookingEmail(identity.customer_email, message.subject, message.html);
      if (!result.success) throw new Error("reason" in result ? String(result.reason) : "delivery-failed");
      const { error: markError } = await db.from("referral_notification_events").update({ sent_at: new Date().toISOString(), processing_at: null, last_error: null }).eq("id", event.id).eq("processing_at", event.processing_at);
      if (markError) throw new Error("delivery-record-failed");
      sent++;
    } catch (reason) {
      failed++;
      await db.from("referral_notification_events").update({ processing_at: null, last_error: reason instanceof Error ? reason.message : "delivery-failed" }).eq("id", event.id).eq("processing_at", event.processing_at);
    }
  }
  return { sent, failed };
}
