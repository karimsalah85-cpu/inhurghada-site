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

describe("seven-day workload", () => {
  it("covers today plus six days across month/year boundaries, excluding completed and missing dates", () => {
    const result = summarizeAdminWork([
      booking({ date: "2026-12-31", guests: 2 }),
      booking({ date: "2027-01-06", guests: null, adults: 3 }),
      booking({ date: "2027-01-01", guests: null }),
      booking({ date: "2027-01-07", guests: 99 }),
      booking({ date: "2026-12-30" }), booking({ date: null }),
      booking({ date: "2027-01-01", status: "completed" }),
      booking({ date: "2027-01-01", status: "cancelled" }),
    ], "2026-12-31");
    expect(result.nextWeek).toHaveLength(3);
    expect(result.nextWeekGuests).toBe(5);
    expect(result.nextWeekMissingGuestCounts).toBe(1);
  });
  it("sorts unpaid follow-ups by oldest service date, retaining completed unpaid work", () => {
    const result = summarizeAdminWork([
      booking({ date: "2026-09-12" }),
      booking({ date: "2026-08-01", status: "completed" }),
    ], "2026-09-13");
    expect(result.overdue.map((row) => row.date)).toEqual(["2026-08-01", "2026-09-12"]);
  });
});

it("counts each multi-trip leg on its own date with its own travelers, but unpaid money once", () => {
  const result = summarizeAdminWork([booking({
    tour_slug: "multi-trip", date: "2026-09-12", amount: 250, guests: 9,
    pricing_snapshot: { trips: [
      { name: "Island", date: "2026-09-13", guests: 2 },
      { name: "Safari", date: "2026-09-14", participants: { adults: 3, youth: 1, infants: 0 } },
      { name: "Diving", date: "2026-09-15" },
    ] },
  })], "2026-09-13");
  expect(result.today).toHaveLength(1);
  expect(result.today[0].tour_name).toBe("Island");
  expect(result.todayGuests).toBe(2);
  expect(result.nextWeek).toHaveLength(3);
  expect(result.nextWeekGuests).toBe(6);
  expect(result.nextWeekMissingGuestCounts).toBe(1);
  expect(result.outstandingByCurrency).toEqual({ USD: 250 });
});
