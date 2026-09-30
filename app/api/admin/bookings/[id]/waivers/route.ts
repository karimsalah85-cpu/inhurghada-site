import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthorization } from "@/lib/admin-permission";
import { whatsappDigits } from "@/lib/supplier-dispatch";
import { requiresWaiver, waiverSignaturesNeeded, waiverStatusLabel, waiverWhatsAppText } from "@/lib/waiver";
import { WAIVER_IS_TEMPLATE, WAIVER_VERSION, getWaiverContent, waiverTemplateNotice } from "@/lib/waiver-content";
import { waiverUrl } from "@/lib/waiver-token";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

type WaiverRow = {
  id: string; participant_name: string; date_of_birth: string | null; certification: string | null;
  medical_declaration: { answers?: Record<string, string>; flagged?: boolean; photo_consent?: boolean } | null;
  signature_name: string; signed_at: string; waiver_version: string;
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

  const needed = waiverSignaturesNeeded(booking);
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
    .select("id,participant_name,date_of_birth,certification,medical_declaration,signature_name,signed_at,waiver_version")
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
    };
  });
  return json({ ...base, pending: false, signed: waivers.length, waivers, label: waiverStatusLabel(waivers.length, needed) });
}
