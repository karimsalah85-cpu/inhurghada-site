import { bookingTrips } from "@/lib/booking-reschedule";
import { historicalTripParticipants } from "@/lib/booking-pricing-snapshot";
import { sumByCurrency } from "@/lib/admin-money";

export type OverviewSetup = { capacityDates: number | null; pickupZones: number | null };

export type OverviewBooking = {
  id: string;
  reference: string;
  customer_name: string;
  tour_name: string | null;
  tour_slug?: string | null;
  pricing_snapshot?: unknown;
  notes?: string | null;
  date: string | null;
  guests: number | null;
  adults?: number | null;
  youth?: number | null;
  infants?: number | null;
  status: string;
  payment_status: string;
  amount: number | string;
  currency: string;
  archived_at?: string | null;
};

export function overviewGuestCount(booking: OverviewBooking): number | null {
  if (booking.guests != null) return Math.max(0, Number(booking.guests) || 0);
  const counts = [booking.adults, booking.youth, booking.infants];
  if (counts.every((count) => count == null)) return null;
  return counts.reduce<number>((total, count) => total + Math.max(0, Number(count) || 0), 0);
}

/** Operational queues exclude archived, cancelled and refunded bookings. */
export function summarizeAdminWork<T extends OverviewBooking>(bookings: T[], day: string) {
  const active = bookings.filter((booking) => !booking.archived_at && booking.status !== "cancelled" && booking.payment_status !== "refunded");
  const scheduled = active.filter((booking) => booking.status !== "completed");
  const byDate = (a: OverviewBooking, b: OverviewBooking) => (a.date || "9999").localeCompare(b.date || "9999") || a.reference.localeCompare(b.reference);
  // A multi-trip reservation can depart on several dates, with different travelers on each leg.
  const departures = scheduled.flatMap((booking) => {
    if (booking.tour_slug !== "multi-trip") return [booking];
    const snapshot = (booking.pricing_snapshot as { trips?: Array<{ guests?: number; participants?: { adults?: number; youth?: number; infants?: number } }> } | null)?.trips;
    const historical = historicalTripParticipants(booking.notes);
    return bookingTrips(booking).map((trip) => {
      const value = Array.isArray(snapshot) ? snapshot[trip.index] : historical[trip.index];
      const source = value && typeof value === "object" ? value : undefined;
      const participants = source?.participants;
      return { ...booking, date: trip.date, tour_name: trip.name, guests: source && "guests" in source ? source.guests ?? null : null, adults: participants?.adults ?? null, youth: participants?.youth ?? null, infants: participants?.infants ?? null };
    });
  });
  const today = departures.filter((booking) => booking.date === day).sort(byDate);
  const pending = scheduled.filter((booking) => booking.status === "new").sort(byDate);
  const upcoming = departures.filter((booking) => booking.date && booking.date >= day).sort(byDate);
  const weekEnd = new Date(`${day}T12:00:00Z`);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  const nextWeek = upcoming.filter((booking) => booking.date! < weekEnd.toISOString().slice(0, 10));
  const unpaid = active.filter((booking) => booking.payment_status === "unpaid");
  const overdue = unpaid.filter((booking) => booking.date && booking.date < day).sort(byDate);
  return {
    today, pending, upcoming, unpaid, overdue, nextWeek,
    undatedDepartures: departures.filter((booking) => !booking.date).length,
    nextWeekGuests: nextWeek.reduce((total, booking) => total + (overviewGuestCount(booking) ?? 0), 0),
    nextWeekMissingGuestCounts: nextWeek.filter((booking) => overviewGuestCount(booking) == null).length,
    todayGuests: today.reduce((total, booking) => total + (overviewGuestCount(booking) ?? 0), 0),
    missingGuestCounts: today.filter((booking) => overviewGuestCount(booking) == null).length,
    outstandingByCurrency: sumByCurrency(unpaid),
  };
}
