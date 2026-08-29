import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { rateLimit } from "@/lib/rate-limit";
import { validateReviewSubmission } from "@/lib/review-validation";

function json(body: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store", ...extraHeaders } });
}

export async function GET(request: NextRequest) {
  const tourSlug = request.nextUrl.searchParams.get("tour_slug")?.trim().slice(0, 80);
  if (!tourSlug) return json({ error: "A tour_slug is required." }, 400);

  const supabase = createAdminClient();
  if (!supabase) return json({ average: 0, count: 0, reviews: [] });

  const { data, error } = await supabase
    .from("reviews")
    .select("customer_name,rating,body,created_at")
    .eq("tour_slug", tourSlug)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) {
    console.error("Fetching approved reviews failed", { tourSlug, message: error.message });
    return json({ average: 0, count: 0, reviews: [] });
  }

  const reviews = data || [];
  const average = reviews.length ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length : 0;
  return json({ average: Math.round(average * 10) / 10, count: reviews.length, reviews });
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const clientAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`review:${clientAddress}`);
  if (!limit.allowed) return json({ error: "Too many attempts. Please try again shortly." }, 429, { "Retry-After": String(limit.retryAfterSeconds) });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return json({ error: "Invalid request." }, 400);
  const validation = validateReviewSubmission(body);
  if (!validation.data) return json({ error: validation.error }, 400);

  const supabase = createAdminClient();
  if (!supabase) return json({ error: "Reviews are not available right now. Please try again later." }, 503);

  const { data, error } = await supabase.rpc("submit_trip_review", {
    p_reference: validation.data.reference,
    p_customer_email: validation.data.email,
    p_rating: validation.data.rating,
    p_body: validation.data.body,
  }).single();
  if (error) {
    const knownMessage = ["We could not find a booking", "Reviews can only be submitted", "This booking cannot be reviewed", "A review has already been submitted", "Rating must be", "Review text is required"].some((prefix) => error.message?.startsWith(prefix));
    return json({ error: knownMessage ? error.message : "We could not save your review. Please try again or contact us." }, knownMessage ? 400 : 500);
  }

  return json({ success: true, review: data }, 201);
}
