import { NextRequest, NextResponse } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createClient } from "@/utils/supabase/server";
import { createRequiredAdminClient } from "@/utils/supabase/admin";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
async function authorize() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user || !(await hasLivePermission(client, user, "bookings"))) return null;
  return { client, user, finance: await hasLivePermission(client, user, "finance") };
}

export async function GET(request: NextRequest) {
  const auth = await authorize();
  if (!auth) return json({ error: "Booking access required." }, 403);
  const bookingId = request.nextUrl.searchParams.get("bookingId") || "";
  if (!uuid.test(bookingId)) return json({ error: "Invalid booking." }, 400);
  const { data: booking, error: bookingError } = await auth.client.from("bookings").select("id,referral_code,referral_exclusion_reason,referral_discount_percent").eq("id", bookingId).single();
  if (bookingError || !booking) return json({ error: "Booking not found." }, 404);
  const admin = createRequiredAdminClient();
  const [referralResult, participantsResult, attemptsResult] = await Promise.all([
    admin.from("referrals").select("id,referral_code,referrer_customer_key,status,review_reasons,rejection_reason,qualified_at").eq("referred_booking_id", bookingId).maybeSingle(),
    admin.from("referral_booking_participants").select("id,email,phone,created_at").eq("booking_id", bookingId).order("created_at"),
    admin.from("referral_attempts").select("id,referral_code,outcome,reasons,created_at").eq("booking_id", bookingId).order("created_at", { ascending: false }),
  ]);
  if (referralResult.error || participantsResult.error || attemptsResult.error) return json({ error: "Referral details are unavailable." }, 503);
  const referral = referralResult.data;
  let referrer = null;
  let audit: unknown[] = [];
  let rewards = null;
  let bookingLedger: unknown[] | null = null;
  if (auth.finance) {
    const result = await admin.from("referral_reward_transactions").select("id,type,reward_units,note,created_at").eq("booking_id", bookingId).order("created_at", { ascending: false });
    if (result.error) return json({ error: "Booking reward ledger is unavailable." }, 503);
    bookingLedger = result.data || [];
  }
  if (referral) {
    const [identity, history] = await Promise.all([
      admin.from("referral_identities").select("customer_name,referral_code").eq("customer_key", referral.referrer_customer_key).maybeSingle(),
      admin.from("referral_review_audit").select("id,decision,reason,actor,created_at").eq("referral_id", referral.id).order("created_at", { ascending: false }),
    ]);
    if (identity.error || history.error) return json({ error: "Referral history is unavailable." }, 503);
    referrer = identity.data;
    audit = history.data || [];
    if (auth.finance) {
      const [balance, ledger, pending] = await Promise.all([
        admin.rpc("referral_reward_balance", { p_customer_key: referral.referrer_customer_key }),
        admin.from("referral_reward_transactions").select("id,type,reward_units,booking_id,note,created_at").eq("customer_key", referral.referrer_customer_key).order("created_at", { ascending: false }).limit(100),
        admin.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_customer_key", referral.referrer_customer_key).in("status", ["pending", "pending_review"]),
      ]);
      if (balance.error || ledger.error || pending.error) return json({ error: "Reward balances are unavailable." }, 503);
      rewards = { balanceUnits: Number(balance.data), pendingUnits: pending.count || 0, ledger: ledger.data || [] };
    }
  }
  // Internal customer keys may contain historical contact data; do not send them to the UI.
  const safeReferral = referral ? { id: referral.id, referral_code: referral.referral_code, status: referral.status, review_reasons: referral.review_reasons, rejection_reason: referral.rejection_reason, qualified_at: referral.qualified_at } : null;
  return json({ booking, referral: safeReferral, referrer, participants: participantsResult.data, attempts: attemptsResult.data || [], audit, rewards, bookingLedger, canReview: auth.finance });
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const auth = await authorize();
  if (!auth) return json({ error: "Booking access required." }, 403);
  const body = await request.json().catch(() => null);
  if (!body || typeof body.bookingId !== "string" || !uuid.test(body.bookingId)) return json({ error: "Invalid booking." }, 400);
  const { data: booking } = await auth.client.from("bookings").select("id,referral_exclusion_reason").eq("id", body.bookingId).single();
  if (!booking) return json({ error: "Booking not found." }, 404);
  if (body.action === "review") {
    if (!auth.finance) return json({ error: "Finance access required for reward decisions." }, 403);
    if (!["approve", "reject"].includes(body.decision) || typeof body.reason !== "string" || body.reason.trim().length < 5 || body.reason.length > 500) return json({ error: "Choose a decision and explain the reason (5–500 characters)." }, 400);
    const admin = createRequiredAdminClient();
    const { data: referral } = await admin.from("referrals").select("id").eq("referred_booking_id", booking.id).single();
    if (!referral) return json({ error: "Referral not found." }, 404);
    const { error } = await admin.rpc("review_referral", { p_referral_id: referral.id, p_decision: body.decision, p_reason: body.reason.trim(), p_actor: auth.user.id });
    if (error) return json({ error: "The referral could not be reviewed. Refresh and check its current status." }, 409);
    return json({ ok: true });
  }
  if (body.action === "exclude") {
    if (body.reason !== null && !["test", "fraud", "no_show", "duplicate"].includes(body.reason)) return json({ error: "Choose a valid exclusion reason." }, 400);
    const { error } = await auth.client.from("bookings").update({ referral_exclusion_reason: body.reason }).eq("id", booking.id).select("id").single();
    if (error) return json({ error: "Could not update referral eligibility." }, 500);
    const { error: auditError } = await auth.client.rpc("record_admin_audit", { action_name: "update", resource_name: "booking", resource_identifier: booking.id, summary_text: "Updated referral eligibility", before_value: booking, after_value: { referral_exclusion_reason: body.reason, actor: auth.user.id } });
    if (auditError) return json({ error: "Eligibility updated, but audit logging failed. Contact an administrator before further changes." }, 500);
    return json({ ok: true });
  }
  if (body.action === "participant") {
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "").replace(/^00/, "") : "";
    if ((!email && !phone) || (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) || (phone && (phone.length < 7 || phone.length > 15))) return json({ error: "Enter a valid participant email or international phone number." }, 400);
    const { error } = await createRequiredAdminClient().from("referral_booking_participants").insert({ booking_id: booking.id, email: email || null, phone: phone || null, created_by: auth.user.id });
    if (error) return json({ error: "Could not add participant evidence." }, 500);
    return json({ ok: true });
  }
  return json({ error: "Choose a valid referral action." }, 400);
}
