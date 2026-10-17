import { describe, expect, it } from "vitest";
import { calculateBookingPrice } from "@/lib/booking-pricing";
import { readPricingSnapshot } from "@/lib/booking-pricing-snapshot";
import { excursionTransferQuote, offersExcursionTransfer } from "@/lib/tour-transfer";
import { eurToUsd } from "@/data/speedboat-booking";

const base = { type: "tour" as const, tourName: "", tourSlug: "orange-bay", adults: 2, youth: 0, infants: 0, service: "", pickup: "", dropoff: "", passengers: 0, travelBags: 0 };

describe("round-trip excursion sedan transfers", () => {
  it.each(["El Gouna", "Makadi Bay"])("adds one return fare per car for %s", (transferArea) => {
    const original = calculateBookingPrice(base).data!;
    const priced = calculateBookingPrice({ ...base, transferRequired: true, transferArea }).data!;
    expect(priced.amount).toBeCloseTo(original.amount + 40);
    expect(priced.pricingSnapshot.trips[0].lines.at(-1)).toMatchObject({ kind: "vehicle", quantity: 1, unitPrice: 40 });
    expect(readPricingSnapshot(priced.pricingSnapshot, priced.currency, priced.amount)).not.toBeNull();
    expect("transferNote" in priced && priced.transferNote).toContain("included in booking total");
  });

  it("counts children and infants as passengers when allocating sedans", () => {
    expect(excursionTransferQuote("El Gouna", 3, "EUR")).toMatchObject({ cars: 1, amount: 40 });
    const original = calculateBookingPrice({ ...base, youth: 1, infants: 1 }).data!;
    const priced = calculateBookingPrice({ ...base, youth: 1, infants: 1, transferRequired: true, transferArea: "El Gouna" }).data!;
    expect(priced.amount).toBeCloseTo(original.amount + 80);
    expect(priced.pricingSnapshot.trips[0].lines.at(-1)?.quantity).toBe(2);
  });

  it("keeps EUR tour rates in EUR", () => {
    const input = { ...base, tourSlug: "safari" };
    const original = calculateBookingPrice(input).data!;
    const priced = calculateBookingPrice({ ...input, transferRequired: true, transferArea: "Makadi Bay" }).data!;
    expect(priced.currency).toBe("EUR");
    expect(priced.amount).toBe(original.amount + 40);
  });

  it("converts the fixed EUR fare for USD catalogue trips", () => {
    const input = { ...base, tourSlug: "orange-bay-half-day-speedboat", selectedBoatOption: "boat-1" };
    const original = calculateBookingPrice(input).data!;
    const priced = calculateBookingPrice({ ...input, transferRequired: true, transferArea: "El Gouna" }).data!;
    expect(priced.currency).toBe("USD");
    expect(priced.amount).toBeCloseTo(original.amount + eurToUsd(40));
  });

  it("ignores a stale area after transfer is deselected", () => {
    expect(calculateBookingPrice({ ...base, transferRequired: false, transferArea: "El Gouna" }).data?.amount).toBe(calculateBookingPrice(base).data?.amount);
  });

  it.each(["", "Unknown", "Hurghada Hotels"])("rejects an unsupported remote area %s", (transferArea) => {
    expect(calculateBookingPrice({ ...base, transferRequired: true, transferArea }).error).toMatch(/transfer area/);
  });

  it("preserves quote requests for unpriced areas without inventing fees", () => {
    const priced = calculateBookingPrice({ ...base, transferRequired: true, transferArea: "Soma Bay" }).data!;
    expect(priced.amount).toBe(calculateBookingPrice(base).data?.amount);
    expect("transferNote" in priced && priced.transferNote).toContain("Extra fee not included");
  });

  it("adds each trip's transfer once to multi-trip totals and snapshots", () => {
    const item = { tourSlug: "orange-bay", date: "2099-01-01", time: "08:00", adults: 2, youth: 0, infants: 0, extras: [], transferRequired: true, transferArea: "El Gouna" };
    const priced = calculateBookingPrice({ ...base, tourSlug: "multi-trip", cartItems: [item, { ...item, date: "2099-01-02", transferArea: "Makadi Bay" }] }).data!;
    const single = calculateBookingPrice({ ...base, transferRequired: true, transferArea: "El Gouna" }).data!;
    expect(priced.amount).toBeCloseTo(single.amount * 2);
    expect(readPricingSnapshot(priced.pricingSnapshot, priced.currency, priced.amount)).not.toBeNull();
    expect("items" in priced && priced.items?.every(item => item.transferNote.includes("Round-trip sedan"))).toBe(true);
  });

  it("keeps this option off other destinations and meeting-point activities", () => {
    expect(offersExcursionTransfer({ destinationSlug: "jeddah" })).toBe(false);
    expect(offersExcursionTransfer({ destinationSlug: "marsa-alam" })).toBe(false);
    expect(offersExcursionTransfer({ destinationSlug: "hurghada", fulfillmentType: "meeting_point" })).toBe(false);
  });
});
