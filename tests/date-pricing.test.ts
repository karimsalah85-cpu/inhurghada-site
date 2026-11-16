import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tours, type Tour } from "@/data/tours";
import { calculateBookingPrice } from "@/lib/booking-pricing";
import { datePriceRates, pickDatePrice, supportsDatePrice, type DatePriceLookup } from "@/lib/date-pricing";
import { bookingTripDates, loadDatePrices } from "@/lib/date-pricing-load";
import { validateAvailabilityRecord } from "@/lib/availability-record";

const booking = { type: "tour" as const, tourName: "", tourSlug: "orange-bay", date: "2026-12-24", time: "08:00", adults: 2, youth: 1, infants: 1, service: "", pickup: "", dropoff: "", passengers: 0, travelBags: 0 };
const only = (slug: string, date: string, price: number): DatePriceLookup => (tourSlug, day) => tourSlug === slug && day === date ? price : undefined;

describe("choosing the price for a date", () => {
  it("prefers the record for the exact start time over the whole-day record", () => {
    const slots = [{ start_time: null, price_override: "40.00" }, { start_time: "08:00:00", price_override: 55 }, { start_time: "13:00:00", price_override: null }];
    expect(pickDatePrice(slots, "08:00")).toBe(55);
    expect(pickDatePrice(slots, "8:00")).toBe(55);
    expect(pickDatePrice(slots, "13:00")).toBe(40);
    expect(pickDatePrice(slots, "Time ")).toBe(40);
    expect(pickDatePrice([{ start_time: "08:00:00", price_override: 55 }], "13:00")).toBeUndefined();
  });

  it("ignores empty, zero and invalid prices", () => {
    expect(pickDatePrice([{ start_time: null, price_override: null }, { start_time: null, price_override: 0 }, { start_time: null, price_override: "abc" }], "08:00")).toBeUndefined();
    expect(pickDatePrice(undefined, "08:00")).toBeUndefined();
  });

  it("keeps the child rate in proportion to the adult rate", () => {
    expect(datePriceRates(26.5, 15.85, undefined)).toEqual({ adult: 26.5, youth: 15.85 });
    expect(datePriceRates(26.5, 15.85, 53)).toEqual({ adult: 53, youth: 31.7 });
    expect(datePriceRates(30, undefined, 45)).toEqual({ adult: 45, youth: undefined });
  });

  it("applies only to trips with a single price", () => {
    expect(supportsDatePrice({})).toBe(true);
    expect(supportsDatePrice({ boatOptions: [{}] })).toBe(false);
    expect(supportsDatePrice({ additionalPackages: [{}] })).toBe(false);
    expect(supportsDatePrice({ groupPricing: [{}] })).toBe(false);
  });
});

describe("checkout total on a date with its own price", () => {
  it("charges the normal price when no price is set", () => {
    expect(calculateBookingPrice(booking, tours, () => undefined).data?.amount).toBe(68.85);
    expect(calculateBookingPrice(booking, tours, only("orange-bay", "2026-12-25", 53)).data?.amount).toBe(68.85);
  });

  it("charges the date price for adults and scales the child price", () => {
    const data = calculateBookingPrice(booking, tours, only("orange-bay", "2026-12-24", 53)).data!;
    expect(data.amount).toBe(137.7); // 2 × 53 + 1 × 31.70 + infant free
    expect(data.pricingSnapshot.trips[0].lines).toMatchObject([{ kind: "adults", quantity: 2, unitPrice: 53 }, { kind: "youth", quantity: 1, unitPrice: 31.7 }, { kind: "infants", unitPrice: 0 }]);
    expect(data.pricingSnapshot.subtotal).toBe(137.7);
  });

  it("leaves extras and transfers at their normal price", () => {
    const transfer = { transferRequired: true, transferArea: "El Gouna" };
    const normal = calculateBookingPrice({ ...booking, ...transfer }, tours).data!;
    const peak = calculateBookingPrice({ ...booking, ...transfer }, tours, only("orange-bay", "2026-12-24", 53)).data!;
    expect(Math.round((peak.amount - normal.amount) * 100) / 100).toBe(68.85); // 137.70 − 68.85
  });

  it("replaces the whole-booking price on per-booking trips", () => {
    const base = tours.find((tour) => tour.slug === "orange-bay")!;
    const charter: Tour = { ...base, slug: "private-charter", title: "Private charter", pricingMode: "per-booking", price: "300", participantPricing: undefined };
    const input = { ...booking, tourSlug: "private-charter", adults: 4, youth: 0, infants: 0 };
    expect(calculateBookingPrice(input, [charter]).data?.amount).toBe(300);
    expect(calculateBookingPrice(input, [charter], only("private-charter", "2026-12-24", 380)).data?.amount).toBe(380);
  });

  it("does not touch trips priced by boat", () => {
    const input = { ...booking, tourSlug: "orange-bay-half-day-speedboat", adults: 4, youth: 0, infants: 0, selectedBoatOption: "boat-1" };
    const normal = calculateBookingPrice(input, tours).data!.amount;
    expect(calculateBookingPrice(input, tours, only("orange-bay-half-day-speedboat", "2026-12-24", 1)).data?.amount).toBe(normal);
  });

  it("prices each leg of a multi-trip booking by its own date", () => {
    const leg = { tourSlug: "orange-bay", time: "08:00", extras: [], adults: 2, youth: 0, infants: 0 };
    const data = calculateBookingPrice({ ...booking, tourSlug: "multi-trip", cartItems: [{ ...leg, date: "2026-12-24" }, { ...leg, date: "2026-12-26" }] }, tours, only("orange-bay", "2026-12-24", 40)).data!;
    expect(data.amount).toBe(133); // 2 × 40 on the priced date + 2 × 26.50 on the normal date
  });
});

describe("loading date prices for a booking", () => {
  function fakeSupabase(rows: unknown[], fail = false) {
    const calls: Record<string, unknown[]> = {};
    const builder: Record<string, unknown> = {};
    for (const method of ["select", "in", "not"]) builder[method] = (...args: unknown[]) => { (calls[method] ||= []).push(args); return builder; };
    builder.then = (resolve: (value: unknown) => unknown) => resolve(fail ? { data: null, error: { message: "down" } } : { data: rows, error: null });
    return { client: { from: () => builder } as unknown as SupabaseClient, calls };
  }

  it("lists the tour dates a request covers", () => {
    expect(bookingTripDates({ type: "tour", tourSlug: "orange-bay", date: "2026-12-24" }, tours)).toEqual([{ tourSlug: "orange-bay", date: "2026-12-24" }]);
    expect(bookingTripDates({ type: "tour", tourSlug: "multi-trip", date: "2026-12-24", cartItems: [{ tourSlug: "orange-bay", date: "2026-12-26" }] }, tours)).toEqual([{ tourSlug: "orange-bay", date: "2026-12-26" }]);
    expect(bookingTripDates({ type: "transfer", date: "2026-12-24" }, tours)).toEqual([]);
    const byName = tours.find((tour) => tour.slug === "orange-bay")!;
    expect(bookingTripDates({ type: "tour", tourName: byName.title, date: "2026-12-24" }, tours)).toEqual([{ tourSlug: "orange-bay", date: "2026-12-24" }]);
  });

  it("returns the price for the matching tour, date and time", async () => {
    const { client } = fakeSupabase([
      { tour_slug: "orange-bay", service_date: "2026-12-24", start_time: null, price_override: "40.00" },
      { tour_slug: "orange-bay", service_date: "2026-12-24", start_time: "13:00:00", price_override: "45.00" },
    ]);
    const { error, lookup } = await loadDatePrices(client, [{ tourSlug: "orange-bay", date: "2026-12-24" }]);
    expect(error).toBeNull();
    expect(lookup("orange-bay", "2026-12-24", "08:00")).toBe(40);
    expect(lookup("orange-bay", "2026-12-24", "13:00")).toBe(45);
    expect(lookup("orange-bay", "2026-12-25", "08:00")).toBeUndefined();
    expect(lookup("mahmya-island", "2026-12-24", "08:00")).toBeUndefined();
  });

  it("reports a failed read instead of falling back to the normal price", async () => {
    const { error } = await loadDatePrices(fakeSupabase([], true).client, [{ tourSlug: "orange-bay", date: "2026-12-24" }]);
    expect(error).toMatch(/temporarily unavailable/i);
  });

  it("skips the query when the request has no tour dates", async () => {
    const { client, calls } = fakeSupabase([]);
    expect((await loadDatePrices(client, [])).error).toBeNull();
    expect(calls.select).toBeUndefined();
  });
});

describe("saving a date price", () => {
  it("refuses a zero price, which would make the trip free", () => {
    expect(validateAvailabilityRecord({ price_override: 0 }, { partial: true }).ok).toBe(false);
    expect(validateAvailabilityRecord({ price_override: "0.01" }, { partial: true })).toEqual({ ok: true, value: { price_override: 0.01 } });
  });
});
