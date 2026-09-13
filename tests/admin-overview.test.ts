import { describe, expect, it } from "vitest";
import { summarizeAdminWork, type OverviewBooking } from "@/lib/admin-overview";

const booking = (patch: Partial<OverviewBooking> = {}): OverviewBooking => ({
  id: "a", reference: "DRS-1", customer_name: "Sample Guest", tour_name: "Boat trip",
  date: "2026-09-13", guests: 2, status: "confirmed", payment_status: "unpaid", amount: 100, currency: "USD", ...patch,
});

describe("admin overview workload", () => {
  it("keeps completed, cancelled, refunded and archived records out of departures", () => {
    const result = summarizeAdminWork([
      booking(), booking({ status: "completed" }), booking({ status: "cancelled" }),
      booking({ payment_status: "refunded" }), booking({ archived_at: "2026-09-12" }),
      booking({ date: "2026-09-14" }),
    ], "2026-09-13");
    expect(result.today).toHaveLength(1);
    expect(result.todayGuests).toBe(2);
    expect(result.upcoming).toHaveLength(2);
  });

  it("falls back to traveler counts and explicitly tracks missing guest information", () => {
    const result = summarizeAdminWork([
      booking({ guests: null, adults: 2, youth: 1, infants: 1 }),
      booking({ guests: null }),
    ], "2026-09-13");
    expect(result.todayGuests).toBe(4);
    expect(result.missingGuestCounts).toBe(1);
  });

  it("prioritizes pending requests by trip date and keeps undated requests visible", () => {
    const result = summarizeAdminWork([
      booking({ reference: "undated", status: "new", date: null }),
      booking({ reference: "future", status: "new", date: "2026-10-01" }),
      booking({ reference: "past", status: "new", date: "2026-09-12" }),
    ], "2026-09-13");
    expect(result.pending.map((item) => item.reference)).toEqual(["past", "future", "undated"]);
    expect(result.upcoming.map((item) => item.reference)).toEqual(["future"]);
  });

  it("calculates unpaid balances per currency without subtracting cancelled paid bookings", () => {
    const result = summarizeAdminWork([
      booking({ status: "completed", date: "2026-09-12", amount: "25" }),
      booking({ amount: 200, currency: "EGP" }),
      booking({ status: "cancelled", payment_status: "paid", amount: 500 }),
      booking({ payment_status: "refunded", amount: 50 }),
    ], "2026-09-13");
    expect(result.outstandingByCurrency).toEqual({ USD: 25, EGP: 200 });
    expect(result.overdue).toHaveLength(1);
  });
});
