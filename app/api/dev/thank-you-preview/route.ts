import { tours } from "@/data/tours";
import { buildReferralMessage } from "@/lib/referral-messages";
import { selectPostTripContext } from "@/lib/post-trip-context";
import { bookingLocale } from "@/lib/booking-communications-i18n";

/** Local, synthetic preview only. Never sends email or reads customer records. */
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") return new Response(null, { status: 404 });
  const url = new URL(request.url);
  const locale = bookingLocale(url.searchParams.get("lang"));
  const slug = url.searchParams.get("trip") || "orange-bay";
  const trip = selectPostTripContext(tours, { tour_slug: slug, locale });
  const email = buildReferralMessage({ event: "trip_completed", customerName: locale === "ar" ? "سارة" : "Sarah", locale, qualified: url.searchParams.get("qualified") !== "false", referralCode: "DRS-DEMO5", bookingReference: "DRS-PREVIEW", trip });
  return new Response(email.html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
}
