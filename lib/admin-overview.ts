import { sumByCurrency } from "@/lib/admin-money";

export type OverviewBooking = {
  id: string;
  reference: string;
  customer_name: string;
  tour_name: string | null;
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
  const byDate = (a: T, b: T) => (a.date || "9999").localeCompare(b.date || "9999") || a.reference.localeCompare(b.reference);
  const today = scheduled.filter((booking) => booking.date === day).sort(byDate);
  const pending = scheduled.filter((booking) => booking.status === "new").sort(byDate);
  const upcoming = scheduled.filter((booking) => booking.date && booking.date >= day).sort(byDate);
  const unpaid = active.filter((booking) => booking.payment_status === "unpaid");
  const overdue = unpaid.filter((booking) => booking.date && booking.date < day);
  return {
    today, pending, upcoming, unpaid, overdue,
    todayGuests: today.reduce((total, booking) => total + (overviewGuestCount(booking) ?? 0), 0),
    missingGuestCounts: today.filter((booking) => overviewGuestCount(booking) == null).length,
    outstandingByCurrency: sumByCurrency(unpaid),
  };
}
