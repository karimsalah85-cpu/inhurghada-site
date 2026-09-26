import { describe, expect, it } from "vitest";
import { calculateBookingPrice } from "@/lib/booking-pricing";
import { historicalTripParticipants, readPricingSnapshot } from "@/lib/booking-pricing-snapshot";
import { parseTransferRequest } from "@/lib/transfer-request";

const input = { type: "tour" as const, tourName: "", tourSlug: "orange-bay", adults: 2, youth: 1, infants: 1, service: "", pickup: "", dropoff: "", passengers: 0, travelBags: 0 };
describe("saved pricing snapshots", () => {
  it("records vehicle and seat prices for each direction, and flags manual quotes", () => {
    for (const zone of ["hurghada_city", "marsa_alam"]) {
      const parsed = parseTransferRequest({ adults: 2, children: 1, infants: 1, zone, tripType: "round_trip", returnDate: "2027-01-02", returnTime: "10:00", childSeats: { infant: 1 } });
      if (!("data" in parsed)) throw new Error(parsed.error);
      const data = calculateBookingPrice({ ...input, type: "transfer", transfer: parsed.data }).data!;
      expect(readPricingSnapshot(data.pricingSnapshot, data.currency, data.amount)).not.toBeNull();
      if (!data.pricingSnapshot.pending) expect(data.pricingSnapshot.trips[0].lines[0]).toMatchObject({ kind: "vehicle", quantity: 2 });
    }
  });
  it("records the Senzo vehicle fare and supplement separately", () => {
    const data = calculateBookingPrice({ ...input, type: "transfer", service: "senzo", passengers: 2, pickup: "Soma Bay", dropoff: "Senzo Mall" }).data!;
    expect(data.pricingSnapshot.trips[0].lines.map(line => [line.kind, line.total])).toEqual([["vehicle", 15], ["extra", 7]]);
  });
  it("records each category's actual unit price including free infants", () => {
    const data = calculateBookingPrice(input).data!;
    expect(data.pricingSnapshot.trips[0].lines).toEqual([
      { kind: "adults", quantity: 2, unitPrice: 25.08, total: 50.16 },
      { kind: "youth", quantity: 1, unitPrice: 20, total: 20 },
      { kind: "infants", quantity: 1, unitPrice: 0, total: 0 },
    ]);
    expect(readPricingSnapshot(data.pricingSnapshot, data.currency, data.amount)).toEqual(data.pricingSnapshot);
  });
  it("reconciles private boats, entrance fees and extras without per-person boat prices", () => {
    const data = calculateBookingPrice({ ...input, infants: 0, tourSlug: "orange-bay-half-day-speedboat", selectedBoatOption: "boat-1", extraQuantities: { "mix-grill": 2 } }).data!;
    expect(data.pricingSnapshot.trips[0].lines[0]).toMatchObject({ kind: "booking", quantity: 1 });
    expect(data.pricingSnapshot.trips[0].lines.filter(line => line.kind === "entrance")).toHaveLength(2);
    expect(readPricingSnapshot(data.pricingSnapshot, data.currency, data.amount)).not.toBeNull();
  });
  it("preserves separate counts, dates and totals for each cart trip", () => {
    const data = calculateBookingPrice({ ...input, tourSlug: "multi-trip", cartItems: [
      { ...input, date: "2027-01-01", time: "08:00", extras: [] },
      { ...input, adults: 1, youth: 0, infants: 0, date: "2027-01-02", time: "09:00", extras: [] },
    ] }).data!;
    expect(data.pricingSnapshot.trips.map(trip => trip.participants?.adults)).toEqual([2, 1]);
    expect(data.pricingSnapshot.trips[1].date).toBe("2027-01-02");
    expect(readPricingSnapshot(data.pricingSnapshot, data.currency, data.amount)).not.toBeNull();
  });
  it("rejects missing, incompatible and inconsistent snapshots", () => {
    const snapshot = calculateBookingPrice(input).data!.pricingSnapshot;
    for (const value of [null, {}, { ...snapshot, version: 2 }, { ...snapshot, subtotal: 90 }, { ...snapshot, currency: "EUR" }]) {
      expect(readPricingSnapshot(value, "USD", 80)).toBeNull();
    }
  });
  it("recovers only the saved multi-trip prefix and ignores customer notes", () => {
    const notes = "1. Sunset cruise\nDate: 2026-09-23\nTime: 5:00 PM\nTravelers: 5 adults · 2 youth · 0 infants\nTrip total: SAR 612.00";
    expect(historicalTripParticipants(notes + "\n\nCustomer note: Travelers: 99 adults")[0].participants).toEqual({ adults: 5, youth: 2, infants: 0 });
    expect(historicalTripParticipants("Customer note: " + notes)).toEqual([]);
  });
});
