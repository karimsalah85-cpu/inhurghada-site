import { NextRequest, NextResponse } from "next/server";
import { createRequiredAdminClient } from "@/utils/supabase/admin";
import { rateLimitShared } from "@/lib/rate-limit";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { referralCustomerKey } from "@/lib/referral";
import { generateOtp, hashOtp } from "@/lib/referral-server";
import { sendBookingEmail } from "@/lib/booking-service";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = await rateLimitShared(`referral-otp-request:${ip}`);
  if (!limit.allowed) return json({ error: "Too many attempts. Please try again shortly." }, 429);

  const body = await request.json().catch(() => null) as { email?: unknown; phone?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const customerKey = referralCustomerKey(email, phone);
  // Always respond the same way regardless of whether this identity has any referral
  // history, so this endpoint cannot be used to probe which emails/phones have bookings.
  if (!customerKey) return json({ sent: true });
  const emailLimit = await rateLimitShared(`referral-otp-request:${customerKey}`);
  if (!emailLimit.allowed) return json({ sent: true });

  const supabase = createRequiredAdminClient();
  const { data: identity } = await supabase.from("referral_identities").select("customer_email, phone").eq("customer_key", customerKey).maybeSingle();
  if (identity?.customer_email) {
    const code = generateOtp();
    await supabase.from("referral_verification_codes").insert({
      customer_key: customerKey,
      code_hash: hashOtp(code),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    await sendBookingEmail(
      identity.customer_email,
      "Your Daily Red Sea referral verification code",
      `<p>Your verification code is:</p><p style="font-size:28px;font-weight:800;letter-spacing:4px">${code}</p><p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>`,
    );
  }
  return json({ sent: true });
}
