import { describe, expect, it } from "vitest";
import { bookingTrips, isClockTime, isIsoDate } from "@/lib/booking-reschedule";

describe("booking reschedule helpers", () => {
  it("accepts only real calendar days and clock times", () => {
    expect(isIsoDate("2026-11-05")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("5/11/2026")).toBe(false);
    expect(isIsoDate(null)).toBe(false);
    expect(isClockTime("09:15")).toBe(true);
    expect(isClockTime("24:00")).toBe(false);
  });

  it("treats every ordinary booking as one trip on the booking date", () => {
    expect(bookingTrips({ tour_slug: "orange-bay", tour_name: "Orange Bay", date: "2026-11-01", pricing_snapshot: { trips: [{ name: "Orange Bay" }] } }))
      .toEqual([{ index: 0, name: "Orange Bay", date: "2026-11-01" }]);
  });

  it("lists the trips of a multi-trip booking from the snapshot, else from its generated notes", () => {
    const snapshot = { trips: [{ name: "Reef Day", date: "2026-11-01" }, { name: "Desert Day", date: "not-a-date" }] };
    expect(bookingTrips({ tour_slug: "multi-trip", date: "2026-11-01", pricing_snapshot: snapshot }))
      .toEqual([{ index: 0, name: "Reef Day", date: "2026-11-01" }, { index: 1, name: "Desert Day", date: null }]);

    const notes = "1. Reef Day\nDate: 2026-09-23\nTime: 5:00 PM\nTravelers: 5 adults · 2 youth · 0 infants\nTrip total: SAR 612.00\n\nCustomer note: Date: 2026-01-01";
    expect(bookingTrips({ tour_slug: "multi-trip", tour_name: "Multi-trip booking: Reef Day", date: "2026-09-23", notes }))
      .toEqual([{ index: 0, name: "Reef Day", date: "2026-09-23" }]);
    expect(bookingTrips({ tour_slug: "multi-trip", tour_name: "Multi-trip booking", date: "2026-09-23", notes: "free text" }))
      .toEqual([{ index: 0, name: "Multi-trip booking", date: "2026-09-23" }]);
  });
});
