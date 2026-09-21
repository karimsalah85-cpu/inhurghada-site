import { NextRequest, NextResponse } from "next/server";
import { createRequiredAdminClient } from "@/utils/supabase/admin";
import { rateLimitShared } from "@/lib/rate-limit";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { hashOtp, signRedemptionToken } from "@/lib/referral-server";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await rateLimitShared(`referral-otp-confirm:${ip}`)).allowed) return json({ error: "Too many attempts. Please try again shortly." }, 429);
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code)) return json({ error: "Enter your booking email and the 6-digit code." }, 400);
  const supabase = createRequiredAdminClient();
  const { data: consumed, error } = await supabase.rpc("consume_referral_otp", { p_customer_key: email, p_code_hash: hashOtp(code) });
  if (error) return json({ error: "Verification is temporarily unavailable." }, 503);
  if (!consumed) return json({ error: "That code is incorrect or has expired." }, 400);
  const { data: account, error: accountError } = await supabase.rpc("referral_account", { p_customer_key: email });
  if (accountError || !account) return json({ error: "Rewards are temporarily unavailable." }, 503);
  return json({
    verified: true, qualified: Boolean(account.qualified),
    referralCode: account.qualified ? account.referral_code : null,
    balanceUnits: Math.max(0, Number(account.balance_units || 0)),
    qualifiedReferrals: Number(account.qualified_referrals || 0),
    pendingReferrals: Number(account.pending_referrals || 0),
    redemptionToken: (() => { try { return signRedemptionToken(email); } catch { return null; } })(),
  });
}
