import { NextRequest, NextResponse } from "next/server";
import { rateLimitShared } from "@/lib/rate-limit";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { siteUrl } from "@/lib/seo";
import { notifyOffice } from "@/lib/supplier-dispatch-server";
import { validateWaiverSubmission } from "@/lib/waiver";
import { WAIVER_VERSION, getWaiverContent } from "@/lib/waiver-content";
import { loadWaiverBooking } from "@/lib/waiver-server";
import { hashIp, verifyWaiverToken } from "@/lib/waiver-token";
import { createAdminClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";

/**
 * One participant's signed waiver from /waiver/<token>. Plain form POST (works
 * without JavaScript), then a 303 back to the page with the outcome. The signed
 * token is the only credential, so submissions are rate-limited per booking and
 * IP. Writes go through the service role only; the raw IP is never stored.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const back = new URL(`/waiver/${encodeURIComponent(token)}`, request.url);
  const redirect = (key: "done" | "error", value: string) => { back.searchParams.set(key, value); back.hash = "status"; return NextResponse.redirect(back, 303); };
  if (!hasValidRequestOrigin(request)) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  const verified = verifyWaiverToken(token);
  if (!verified) return NextResponse.json({ error: "This link is not valid." }, { status: 404 });
  if (verified.expired) return redirect("error", "expired");

  const clientAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = await rateLimitShared(`waiver:${verified.reference}:${clientAddress}`, 12, 15 * 60 * 1000);
  if (!limit.allowed) return redirect("error", "busy");

  const content = getWaiverContent("en");
  const form = await request.formData().catch(() => null);
  if (!form) return redirect("error", "invalid");
  const parsed = validateWaiverSubmission(form, content);
  if (!parsed.ok) return redirect("error", parsed.error);
  const submission = parsed.value;

  const database = createAdminClient();
  if (!database) return redirect("error", "unavailable");
  const booking = await loadWaiverBooking(database, verified.reference);
  if (!booking) return redirect("error", "missing");
  if (!booking.available) return redirect("error", "unavailable");
  if (booking.cancelled) return redirect("error", "cancelled");
  const sameName = (name: string) => name.localeCompare(submission.participantName, "en", { sensitivity: "base" }) === 0;
  if (booking.signed.some((row) => sameName(row.participantName))) return redirect("done", "already");
  if (booking.signed.length >= booking.needed) return redirect("error", "complete");

  // The count check is repeated inside the database under a lock on the booking, so two
  // people signing at the same moment cannot exceed the number of divers.
  const { data: outcome, error } = await database.rpc("submit_booking_waiver", {
    p_booking_id: booking.id,
    p_needed: booking.needed,
    p_participant_name: submission.participantName,
    p_date_of_birth: submission.dateOfBirth,
    p_certification: submission.certification,
    p_medical_declaration: { answers: submission.medicalAnswers, flagged: submission.medicalFlagged, photo_consent: submission.photoConsent },
    p_signature_name: submission.signatureName,
    p_ip_hash: clientAddress === "unknown" ? null : hashIp(clientAddress),
    p_user_agent: (request.headers.get("user-agent") || "").slice(0, 400) || null,
    p_waiver_version: WAIVER_VERSION,
  });
  if (error) {
    console.error("Waiver not saved", { reference: booking.reference, code: error.code, message: error.message });
    return redirect("error", "unavailable");
  }
  if (outcome === "already") return redirect("done", "already");
  if (outcome === "complete") return redirect("error", "complete");
  if (outcome !== "signed") return redirect("error", "missing");

  if (submission.medicalFlagged) {
    const questions = content.medicalQuestions.filter((question) => submission.medicalAnswers[question.id] === "yes").map((question) => `• ${question.text}`);
    await notifyOffice(`Medical YES on diving waiver · ${booking.reference}`, [
      `${submission.participantName} answered YES to a medical question on the diving waiver for booking ${booking.reference} (${booking.tourName}, ${booking.date || "date pending"}).`,
      ...questions,
      "A doctor's written clearance is required before this guest can dive. Please contact the guest and inform the dive centre.",
      `Open the booking in the admin: ${new URL("/admin", siteUrl).toString()}`,
    ]);
  }
  return redirect("done", submission.medicalFlagged ? "flagged" : "signed");
}
