import type { SupabaseClient } from "@supabase/supabase-js";
import { pickDatePrice, type DatePriceLookup, type DatePriceSlot } from "@/lib/date-pricing";

type BookingTrips = {
  type: string;
  tourSlug?: string;
  tourName?: string;
  date?: string;
  cartItems?: Array<{ tourSlug: string; date: string }>;
};

/** The tour/date pairs a booking request covers: each leg of a multi-trip booking, or the one trip. */
export function bookingTripDates(body: BookingTrips, catalog: ReadonlyArray<{ slug: string; title: string }>) {
  if (body.type !== "tour") return [];
  if (body.tourSlug === "multi-trip") return (body.cartItems || []).map((item) => ({ tourSlug: item.tourSlug, date: item.date }));
  const tourSlug = body.tourSlug || catalog.find((tour) => tour.title === body.tourName)?.slug;
  return tourSlug && body.date ? [{ tourSlug, date: body.date }] : [];
}

/**
 * Loads the prices set for the given tour dates. A failed read is reported instead of being
 * treated as "no price set", so a peak date is never sold at the normal price by accident.
 */
export async function loadDatePrices(supabase: SupabaseClient, trips: ReadonlyArray<{ tourSlug: string; date: string }>): Promise<{ error: string | null; lookup: DatePriceLookup }> {
  const none: DatePriceLookup = () => undefined;
  if (!trips.length) return { error: null, lookup: none };
  const { data, error } = await supabase.from("tour_availability")
    .select("tour_slug,service_date,start_time,price_override")
    .in("tour_slug", [...new Set(trips.map((trip) => trip.tourSlug))])
    .in("service_date", [...new Set(trips.map((trip) => trip.date))])
    .not("price_override", "is", null);
  if (error) return { error: "Prices are temporarily unavailable. Please try again.", lookup: none };
  const slots = new Map<string, DatePriceSlot[]>();
  for (const row of (data || []) as Array<DatePriceSlot & { tour_slug: string; service_date: string }>) {
    const key = `${row.tour_slug}|${String(row.service_date).slice(0, 10)}`;
    slots.set(key, [...(slots.get(key) || []), row]);
  }
  return { error: null, lookup: (tourSlug, date, time) => pickDatePrice(slots.get(`${tourSlug}|${date}`), time) };
}
