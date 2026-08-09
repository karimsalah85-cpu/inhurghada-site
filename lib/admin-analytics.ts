export type ServiceBooking = { tour_name: string | null; date: string | null; status: string };

export type TopService = {
  service: string;
  bookings: number;
  previousBookings: number;
  trend: number | null;
};

export function rankTopServices(current: ServiceBooking[], previous: ServiceBooking[]): TopService[] {
  const count = (rows: ServiceBooking[]) => rows.reduce<Record<string, number>>((totals, row) => {
    if (row.status !== "confirmed") return totals;
    const service = row.tour_name?.trim() || "Private transfer";
    totals[service] = (totals[service] || 0) + 1;
    return totals;
  }, {});
  const currentCounts = count(current);
  const previousCounts = count(previous);
  return Object.entries(currentCounts)
    .map(([service, bookings]) => {
      const previousBookings = previousCounts[service] || 0;
      return { service, bookings, previousBookings, trend: previousBookings ? ((bookings - previousBookings) / previousBookings) * 100 : null };
    })
    .sort((a, b) => b.bookings - a.bookings || a.service.localeCompare(b.service));
}

const words = (value: string) => new Set(value.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter((word) => word.length > 2));

export function matchesServiceCampaign(service: string, campaign: string) {
  const campaignWords = words(campaign);
  return [...words(service)].filter((word) => campaignWords.has(word)).length >= 2;
}

export function totalBookingExpenses(rows: Array<{ booking_id: string | null; amount: number | string }>, bookingId: string) {
  return rows.filter(row => row.booking_id === bookingId).reduce((total, row) => total + Number(row.amount || 0), 0);
}
