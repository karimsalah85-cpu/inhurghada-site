import type { SupabaseClient } from "@supabase/supabase-js";
import { multiTripLoads } from "@/lib/availability-bulk";
import { fetchAllPages } from "@/lib/supabase-paging";

type SingleBooking = { guests: number | null; start_time: string | null };
type MultiBooking = { reference: string; pricing_snapshot: unknown };

/**
 * Places already booked on one tour and date, so a new availability record starts from real
 * demand instead of zero (a 10-seat limit added to a date with 8 guests must show 2 left).
 * A timed record counts bookings for that start time plus bookings with no time.
 */
export async function bookedPlaces(supabase: SupabaseClient, slot: { tour_slug: string; service_date: string; start_time: string | null }, slugByTitle: Map<string, string>) {
  // Multi-trip legs can fall up to two weeks after the booking's own (first-leg) date.
  const multiFrom = new Date(Date.parse(`${slot.service_date}T00:00:00Z`) - 14 * 86_400_000).toISOString().slice(0, 10);
  const [single, multi] = await Promise.all([
    fetchAllPages<SingleBooking>((from, to) => supabase.from("bookings").select("guests,start_time").eq("tour_slug", slot.tour_slug).eq("date", slot.service_date).neq("status", "cancelled").order("id").range(from, to)),
    fetchAllPages<MultiBooking>((from, to) => supabase.from("bookings").select("reference,pricing_snapshot").eq("tour_slug", "multi-trip").gte("date", multiFrom).lte("date", slot.service_date).neq("status", "cancelled").order("id").range(from, to)),
  ]);
  const error = single.error || multi.error;
  if (error) return { error: error.message, places: 0 };
  const sameTime = (value: string | null) => !slot.start_time || !value || value.slice(0, 5) === slot.start_time.slice(0, 5);
  const direct = (single.data || []).filter((booking) => sameTime(booking.start_time)).reduce((sum, booking) => sum + Math.max(0, Number(booking.guests || 0)), 0);
  const legs = multiTripLoads(multi.data || [], slugByTitle, { from: slot.service_date, to: slot.service_date }).loads
    .filter((load) => load.tour_slug === slot.tour_slug)
    .reduce((sum, load) => sum + Math.max(0, Number(load.guests || 0)), 0);
  return { error: null, places: direct + legs };
}
