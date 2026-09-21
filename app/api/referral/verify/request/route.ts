import { bookingLocale } from "@/lib/booking-communications-i18n";
import { referralNotificationCopy } from "@/lib/referral-notification-copy";
import { NextRequest, NextResponse } from "next/server";
import { createRequiredAdminClient } from "@/utils/supabase/admin";
import { rateLimitShared } from "@/lib/rate-limit";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { generateOtp, hashOtp } from "@/lib/referral-server";
import { sendBookingEmail } from "@/lib/booking-service";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = await rateLimitShared(`referral-otp-request:${ip}`);
  if (!limit.allowed) return json({ error: "Too many attempts. Please try again shortly." }, 429);

  const body = await request.json().catch(() => null) as { email?: unknown; phone?: unknown; locale?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const customerKey = email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
  // Always respond the same way regardless of whether this identity has any referral
  // history, so this endpoint cannot be used to probe which emails/phones have bookings.
  if (!customerKey) return json({ sent: true });
  const emailLimit = await rateLimitShared(`referral-otp-request:${customerKey}`);
  if (!emailLimit.allowed) return json({ sent: true });

  const supabase = createRequiredAdminClient();
  const { error: accountError } = await supabase.rpc("referral_account", { p_customer_key: customerKey });
  if (accountError) return json({ error: "Verification is temporarily unavailable." }, 503);
  const { data: identity } = await supabase.from("referral_identities").select("customer_email, phone").eq("customer_key", customerKey).maybeSingle();
  if (identity?.customer_email) {
    const code = generateOtp();
    const { error: insertError } = await supabase.from("referral_verification_codes").insert({
      customer_key: customerKey,
      code_hash: hashOtp(code),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    if (insertError) return json({ error: "Verification is temporarily unavailable." }, 503);
    const copy = referralNotificationCopy[bookingLocale(typeof body?.locale === "string" ? body.locale : "en")];
    await sendBookingEmail(
      identity.customer_email,
      copy.otpSubject,
      `<p>${copy.otpSubject}</p><p style="font-size:28px;font-weight:800;letter-spacing:4px">${code}</p><p>${copy.otpBody}</p>`,
    );
  }
  return json({ sent: true });
}
