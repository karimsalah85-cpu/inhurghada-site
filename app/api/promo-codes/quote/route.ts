import { NextRequest, NextResponse } from "next/server";
import { calculateBookingPrice } from "@/lib/booking-pricing";
import { validateBookingInput } from "@/lib/booking-validation";
import { createRequiredAdminClient } from "@/utils/supabase/admin";
import { normalizePromoCode, quotePromo, type PromoCode } from "@/lib/promo-codes";
import { rateLimitShared } from "@/lib/rate-limit";
import { hasValidRequestOrigin } from "@/lib/request-origin";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = await rateLimitShared(`promo-quote:${ip}`);
  if (!limit.allowed) return json({ error: "Too many attempts. Please try again shortly." }, 429);
  try {
    const input = await request.json();
    const code = normalizePromoCode(input?.promoCode);
    const validation = validateBookingInput(input);
    if (!validation.data || validation.data.type !== "tour") return json({ error: validation.error || "Promo codes are available for trip bookings." }, 400);
    const pricing = calculateBookingPrice(validation.data);
    if (!pricing.data) return json({ error: pricing.error }, 400);
    const { data, error } = await createRequiredAdminClient().from("promo_codes").select("*").eq("code", code).maybeSingle();
    if (error) return json({ error: "Promo codes are temporarily unavailable." }, 503);
    if (!data) return json({ error: "Promo code is invalid, expired or not eligible for this booking." }, 400);
    const slugs = validation.data.tourSlug === "multi-trip" ? validation.data.cartItems.map(item => item.tourSlug) : [validation.data.tourSlug];
    return json({ quote: quotePromo(data as PromoCode, pricing.data.amount, pricing.data.currency, slugs) });
  } catch (error) { return json({ error: error instanceof Error ? error.message : "Could not apply promo code." }, 400); }
}
