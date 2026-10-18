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

  it.each([
    ["El Ahyaa", 15], ["Sahl Hasheesh", 15], ["Makadi Bay", 20], ["El Gouna", 20], ["Soma Bay", 25],
  ] as const)("prices %s at €%i one way and double for a round trip", (area, oneWay) => {
    expect(excursionTransferQuote(area, 2, "EUR", "one_way")).toMatchObject({ cars: 1, unitPrice: oneWay, amount: oneWay, legs: 1 });
    expect(excursionTransferQuote(area, 2, "EUR", "round_trip")).toMatchObject({ cars: 1, unitPrice: oneWay * 2, amount: oneWay * 2, legs: 2 });
    expect(excursionTransferQuote(area, 2, "EUR")?.amount).toBe(oneWay * 2);
  });

  it("prices transport within Hurghada at €10 one way for marina-transfer trips", () => {
    expect(excursionTransferQuote("Hurghada Hotels", 3, "EUR", "one_way")).toMatchObject({ cars: 1, amount: 10 });
    expect(excursionTransferQuote("Hurghada Hotels", 4, "EUR", "round_trip")).toMatchObject({ cars: 2, unitPrice: 20, amount: 40 });
  });

  it("charges a one-way fare per car and labels it in the snapshot and note", () => {
    const original = calculateBookingPrice(base).data!;
    const priced = calculateBookingPrice({ ...base, transferRequired: true, transferArea: "Soma Bay", transferTrip: "one_way" }).data!;
    expect(priced.amount).toBeCloseTo(original.amount + 25);
    expect(priced.pricingSnapshot.trips[0].lines.at(-1)).toMatchObject({ kind: "vehicle", quantity: 1, unitPrice: 25 });
    expect("transferNote" in priced && priced.transferNote).toContain("One-way sedan transfer");
  });

  it.each(["", "Unknown", "Hurghada Hotels"])("rejects an unsupported remote area %s", (transferArea) => {
    expect(calculateBookingPrice({ ...base, transferRequired: true, transferArea }).error).toMatch(/transfer area/);
  });

  it("preserves quote requests for unpriced areas without inventing fees", () => {
    const priced = calculateBookingPrice({ ...base, transferRequired: true, transferArea: "Safaga" }).data!;
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
