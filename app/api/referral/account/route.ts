import { NextRequest, NextResponse } from "next/server";
import { createRequiredAdminClient } from "@/utils/supabase/admin";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { verifyRedemptionToken } from "@/lib/referral-server";
import { rateLimitShared } from "@/lib/rate-limit";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await rateLimitShared(`referral-account:${ip}`)).allowed) return json({ error: "Too many requests." }, 429);
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || typeof body?.token !== "string" || !verifyRedemptionToken(body.token, email)) return json({ error: "Verify your booking email to view rewards." }, 401);
  const { data, error } = await createRequiredAdminClient().rpc("referral_account", { p_customer_key: email });
  if (error || !data) return json({ error: "Rewards are temporarily unavailable." }, 503);
  return json({ verified: true, qualified: Boolean(data.qualified), referralCode: data.qualified ? data.referral_code : null, balanceUnits: Math.max(0, Number(data.balance_units || 0)), qualifiedReferrals: Number(data.qualified_referrals || 0), pendingReferrals: Number(data.pending_referrals || 0) });
}
