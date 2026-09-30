import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { maxTicketTrips } from "@/lib/ticket-token";

export type TicketView = {
  bookingId: string;
  reference: string;
  tripIndex: number;
  tripCount: number;
  tripName: string;
  date: string | null;
  time: string | null;
  pickup: string | null;
  travelers: string;
  guests: number;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  bookingStatus: string;
  paymentStatus: string;
  amount: number;
  currency: string;
  locale: string;
  checkedInAt: string | null;
  checkedInBy: string | null;
  /** False when the check-in table has not been migrated yet. */
  checkInAvailable: boolean;
};

type SnapshotTrip = { name?: unknown; date?: unknown; time?: unknown; guests?: unknown; participants?: { adults?: unknown; youth?: unknown; infants?: unknown } | null };

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);
const count = (value: unknown) => (Number.isInteger(value) && (value as number) >= 0 ? (value as number) : 0);

export function travelerLabel(adults: number, youth: number, infants: number, guests: number) {
  const parts = [
    adults ? `${adults} adult${adults === 1 ? "" : "s"}` : "",
    youth ? `${youth} youth` : "",
    infants ? `${infants} infant${infants === 1 ? "" : "s"}` : "",
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : `${guests} guest${guests === 1 ? "" : "s"}`;
}

/** Reads the live booking behind a verified ticket token; null when the trip does not exist. */
export async function loadTicket(database: SupabaseClient, reference: string, tripIndex: number): Promise<TicketView | null> {
  const { data: booking, error } = await database.from("bookings")
    .select("id,reference,customer_name,customer_email,phone,tour_name,date,start_time,guests,adults,youth,infants,hotel,amount,currency,status,payment_status,locale,pricing_snapshot")
    .eq("reference", reference).maybeSingle();
  if (error || !booking) return null;

  const snapshotTrips = Array.isArray((booking.pricing_snapshot as { trips?: unknown } | null)?.trips)
    ? ((booking.pricing_snapshot as { trips: SnapshotTrip[] }).trips).slice(0, maxTicketTrips)
    : [];
  const tripCount = Math.max(snapshotTrips.length, 1);
  if (tripIndex >= tripCount) return null;
  const trip = snapshotTrips[tripIndex];

  const guests = trip ? count(trip.guests) || count(booking.guests) : count(booking.guests);
  const adults = trip?.participants ? count(trip.participants.adults) : snapshotTrips.length > 1 ? 0 : count(booking.adults);
  const youth = trip?.participants ? count(trip.participants.youth) : snapshotTrips.length > 1 ? 0 : count(booking.youth);
  const infants = trip?.participants ? count(trip.participants.infants) : snapshotTrips.length > 1 ? 0 : count(booking.infants);

  let checkedInAt: string | null = null, checkedInBy: string | null = null, checkInAvailable = true;
  const { data: checkin, error: checkinError } = await database.from("booking_ticket_checkins")
    .select("checked_in_at,checked_in_by").eq("booking_id", booking.id).eq("trip_index", tripIndex).maybeSingle();
  if (checkinError) checkInAvailable = false;
  else if (checkin) { checkedInAt = checkin.checked_in_at; checkedInBy = checkin.checked_in_by; }

  return {
    bookingId: booking.id,
    reference: booking.reference,
    tripIndex,
    tripCount,
    tripName: text(trip?.name) || text(booking.tour_name) || "Daily Red Sea experience",
    date: text(trip?.date) || text(booking.date),
    time: text(trip?.time) || (text(booking.start_time)?.slice(0, 5) ?? null),
    pickup: text(booking.hotel),
    travelers: travelerLabel(adults, youth, infants, guests),
    guests,
    customerName: text(booking.customer_name) || "Guest",
    customerEmail: text(booking.customer_email),
    customerPhone: text(booking.phone),
    bookingStatus: text(booking.status) || "new",
    paymentStatus: text(booking.payment_status) || "unpaid",
    amount: Number(booking.amount || 0),
    currency: (text(booking.currency) || "USD").toUpperCase(),
    locale: text(booking.locale) || "en",
    checkedInAt,
    checkedInBy,
    checkInAvailable,
  };
}
