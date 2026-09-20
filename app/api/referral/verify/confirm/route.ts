import { NextRequest, NextResponse } from "next/server";
import { createRequiredAdminClient } from "@/utils/supabase/admin";
import { rateLimitShared } from "@/lib/rate-limit";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { referralCustomerKey } from "@/lib/referral";
import { hashOtp, signRedemptionToken } from "@/lib/referral-server";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = await rateLimitShared(`referral-otp-confirm:${ip}`);
  if (!limit.allowed) return json({ error: "Too many attempts. Please try again shortly." }, 429);

  const body = await request.json().catch(() => null) as { email?: unknown; phone?: unknown; code?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const customerKey = referralCustomerKey(email, phone);
  if (!customerKey || !/^\d{6}$/.test(code)) return json({ error: "Enter the 6-digit code we sent you." }, 400);

  const supabase = createRequiredAdminClient();
  const { data: candidate } = await supabase
    .from("referral_verification_codes")
    .select("id, code_hash, attempts")
    .eq("customer_key", customerKey)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!candidate || candidate.attempts >= 5 || candidate.code_hash !== hashOtp(code)) {
    if (candidate) await supabase.from("referral_verification_codes").update({ attempts: candidate.attempts + 1 }).eq("id", candidate.id);
    return json({ error: "That code is incorrect or has expired." }, 400);
  }
  await supabase.from("referral_verification_codes").update({ consumed_at: new Date().toISOString() }).eq("id", candidate.id);

  const [{ data: identity }, { data: balance }] = await Promise.all([
    supabase.from("referral_identities").select("referral_code").eq("customer_key", customerKey).maybeSingle(),
    supabase.rpc("referral_reward_balance", { p_customer_key: customerKey }),
  ]);
  const { count: qualified } = await supabase.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_customer_key", customerKey).eq("status", "qualified");
  const { count: pending } = await supabase.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_customer_key", customerKey).eq("status", "pending");

  return json({
    verified: true,
    referralCode: identity?.referral_code || null,
    balanceUnits: Number(balance || 0),
    qualifiedReferrals: qualified || 0,
    pendingReferrals: pending || 0,
    // Signing can be unavailable if REFERRAL_TOKEN_SECRET is not configured yet; verification
    // and viewing rewards should still work, just without the ability to redeem at checkout.
    redemptionToken: (() => { try { return signRedemptionToken(customerKey); } catch { return null; } })(),
  });
}
