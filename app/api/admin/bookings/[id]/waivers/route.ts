import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthorization } from "@/lib/admin-permission";
import { whatsappDigits } from "@/lib/supplier-dispatch";
import { requiresWaiver, waiverSignaturesNeeded, waiverStatusLabel, waiverWhatsAppText } from "@/lib/waiver";
import { WAIVER_IS_TEMPLATE, WAIVER_VERSION, getWaiverContent, waiverTemplateNotice } from "@/lib/waiver-content";
import { waiverUrl } from "@/lib/waiver-token";
import { hasValidRequestOrigin } from "@/lib/request-origin";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

type WaiverRow = {
  id: string; participant_name: string; date_of_birth: string | null; certification: string | null;
  medical_declaration: { answers?: Record<string, string>; flagged?: boolean; photo_consent?: boolean } | null;
  signature_name: string; signed_at: string; waiver_version: string;
  voided_at: string | null; voided_by: string | null; void_reason: string | null;
};

/** Waiver status for the booking detail panel: signatures needed/collected, medical flags, and the signed link. */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return json({ error: "Invalid booking identifier." }, 400);
  const { supabase, allowed } = await getAdminAuthorization("view_bookings");
  if (!allowed) return json({ error: "Booking access required." }, 403);

  const { data: booking, error } = await supabase.from("bookings")
    .select("id,reference,customer_name,phone,tour_name,tour_slug,date,guests,adults,youth,infants").eq("id", id).maybeSingle();
  if (error || !booking) return json({ error: "Booking not found." }, 404);
  if (!requiresWaiver(booking.tour_slug)) return json({ required: false });

  // Same rule as the public page: at least one signature, even when the headcount was not recorded.
  const needed = Math.max(waiverSignaturesNeeded(booking), 1);
  let link: string | null = null;
  try { link = waiverUrl(booking.reference, booking.date); } catch { link = null; }
  const base = {
    required: true,
    needed,
    link,
    whatsapp_url: link && whatsappDigits(booking.phone)
      ? `https://wa.me/${whatsappDigits(booking.phone)}?text=${encodeURIComponent(waiverWhatsAppText({ customerName: booking.customer_name, reference: booking.reference, tourName: booking.tour_name, link, needed }))}`
      : null,
    template_notice: WAIVER_IS_TEMPLATE ? waiverTemplateNotice : null,
    current_version: WAIVER_VERSION,
  };

  const { data: rows, error: waiverError } = await supabase.from("booking_waivers")
    .select("id,participant_name,date_of_birth,certification,medical_declaration,signature_name,signed_at,waiver_version,voided_at,voided_by,void_reason")
    .eq("booking_id", id).order("signed_at");
  if (waiverError) {
    if (["42P01", "PGRST205"].includes(waiverError.code || "")) return json({ ...base, pending: true, signed: 0, waivers: [], label: "Database upgrade pending" });
    return json({ error: "Waivers could not be loaded." }, 500);
  }
  const questions = new Map(getWaiverContent("en").medicalQuestions.map((question) => [question.id, question.text]));
  const waivers = ((rows || []) as WaiverRow[]).map((row) => {
    const answers = row.medical_declaration?.answers || {};
    return {
      id: row.id,
      participant_name: row.participant_name,
      date_of_birth: row.date_of_birth,
      certification: row.certification,
      signature_name: row.signature_name,
      signed_at: row.signed_at,
      waiver_version: row.waiver_version,
      photo_consent: Boolean(row.medical_declaration?.photo_consent),
      medical_flagged: Boolean(row.medical_declaration?.flagged),
      medical_yes: Object.entries(answers).filter(([, answer]) => answer === "yes").map(([questionId]) => questions.get(questionId) || questionId),
      voided_at: row.voided_at,
      void_reason: row.void_reason,
    };
  });
  const live = waivers.filter((waiver) => !waiver.voided_at).length;
  return json({ ...base, pending: false, signed: live, waivers, label: waiverStatusLabel(live, needed) });
}

/**
 * Voids one signature (e.g. a forwarded link filled in with a wrong name) so the slot frees up.
 * The row is kept with who voided it and why; RLS allows only these columns, only for booking staff.
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  if (process.env.VERCEL_ENV === "preview") return json({ error: "Administration changes are disabled in this preview until an isolated test database is configured." }, 503);
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return json({ error: "Invalid booking identifier." }, 400);
  const { supabase, user, allowed } = await getAdminAuthorization("edit_bookings");
  if (!allowed || !user) return json({ error: "Booking edit access required." }, 403);
  const body = await request.json().catch(() => null) as { waiverId?: unknown; reason?: unknown } | null;
  const waiverId = String(body?.waiverId || "");
  const reason = String(body?.reason || "").trim().slice(0, 300);
  if (!uuidPattern.test(waiverId)) return json({ error: "Choose a signature to void." }, 400);
  if (reason.length < 3) return json({ error: "Give a short reason." }, 400);
  const { data, error } = await supabase.from("booking_waivers")
    .update({ voided_at: new Date().toISOString(), voided_by: user.email || user.id, void_reason: reason })
    .eq("id", waiverId).eq("booking_id", id).is("voided_at", null)
    .select("id,participant_name").maybeSingle();
  if (error) return json({ error: "Could not void this signature." }, 500);
  if (!data) return json({ error: "Signature not found or already voided." }, 404);
  await supabase.rpc("record_admin_audit", { action_name: "void", resource_name: "booking_waiver", resource_identifier: waiverId, summary_text: `Voided waiver signature for ${data.participant_name}: ${reason}`, before_value: null, after_value: { booking_id: id, reason } });
  return json({ ok: true });
}
