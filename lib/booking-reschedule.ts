import { historicalTripParticipants } from "@/lib/booking-pricing-snapshot";

export type ReschedulableBooking = {
  tour_slug?: string | null;
  tour_name?: string | null;
  date?: string | null;
  notes?: string | null;
  pricing_snapshot?: unknown;
};

export type BookingTrip = { index: number; name: string; date: string | null };

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

/** A real calendar day written as YYYY-MM-DD. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !isoDatePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function isClockTime(value: unknown): value is string {
  return typeof value === "string" && timePattern.test(value);
}

/**
 * The trips whose dates staff can move. A multi-trip booking lists each trip
 * (from its pricing snapshot, or from the generated notes of older bookings);
 * every other booking is a single trip on the booking date.
 */
export function bookingTrips(booking: ReschedulableBooking): BookingTrip[] {
  const single = [{ index: 0, name: booking.tour_name || "Booking", date: booking.date ?? null }];
  if (booking.tour_slug !== "multi-trip") return single;
  const snapshotTrips = (booking.pricing_snapshot as { trips?: unknown } | null | undefined)?.trips;
  if (Array.isArray(snapshotTrips) && snapshotTrips.length) {
    return snapshotTrips.map((trip, index) => {
      const value = (trip && typeof trip === "object" ? trip : {}) as { name?: unknown; date?: unknown };
      return {
        index,
        name: typeof value.name === "string" && value.name.trim() ? value.name.trim() : `Trip ${index + 1}`,
        date: isIsoDate(value.date) ? value.date : null,
      };
    });
  }
  const historical = historicalTripParticipants(booking.notes);
  return historical.length ? historical.map((trip, index) => ({ index, name: trip.name, date: trip.date })) : single;
}
