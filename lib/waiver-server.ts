import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requiresWaiver, waiverSignaturesNeeded } from "@/lib/waiver";

export type WaiverBooking = {
  id: string;
  reference: string;
  tourName: string;
  date: string | null;
  cancelled: boolean;
  needed: number;
  signed: { participantName: string; signedAt: string }[];
  /** False when the booking_waivers table has not been migrated yet. */
  available: boolean;
};

/** Reads the live booking behind a verified waiver token; null when it does not exist or is not a diving booking. */
export async function loadWaiverBooking(database: SupabaseClient, reference: string): Promise<WaiverBooking | null> {
  const { data: booking, error } = await database.from("bookings")
    .select("id,reference,tour_name,tour_slug,date,status,guests,adults,youth,infants")
    .eq("reference", reference).maybeSingle();
  if (error || !booking || !requiresWaiver(booking.tour_slug)) return null;
  const { data: rows, error: waiverError } = await database.from("booking_waivers")
    .select("participant_name,signed_at").eq("booking_id", booking.id).order("signed_at");
  return {
    id: booking.id,
    reference: booking.reference,
    tourName: booking.tour_name || "Diving trip",
    date: booking.date,
    cancelled: booking.status === "cancelled",
    // Always allow at least one signature, even when the headcount was not recorded.
    needed: Math.max(waiverSignaturesNeeded(booking), 1),
    signed: waiverError ? [] : (rows || []).map((row) => ({ participantName: row.participant_name, signedAt: row.signed_at })),
    available: !waiverError,
  };
}
