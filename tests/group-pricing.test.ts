import { describe, expect, it } from "vitest";
import { calculateBookingPrice } from "@/lib/booking-pricing";
import { groupRate, groupTierRanges } from "@/lib/group-pricing";
import { codeControlledTourFields } from "@/lib/live-content";
import { tours } from "@/data/tours";

const tiers = [{ minTravelers: 1, pricePerPerson: 170.99 }, { minTravelers: 4, pricePerPerson: 148.19 }, { minTravelers: 6, pricePerPerson: 113.99 }];
const booking = (tourSlug: string, adults: number) => calculateBookingPrice({ type: "tour", tourName: "", tourSlug, adults, youth: 0, infants: 0, service: "", pickup: "", dropoff: "", passengers: 0, travelBags: 0 }).data!;

describe("group pricing", () => {
  it("picks the highest tier the group reaches", () => {
    expect([1, 2, 3, 4, 5, 6, 8, 12].map((travelers) => groupRate(tiers, travelers))).toEqual([170.99, 170.99, 170.99, 148.19, 148.19, 113.99, 113.99, 113.99]);
    expect(groupRate(undefined, 4)).toBeUndefined();
  });

  it("labels tier ranges for the booking form", () => {
    expect(groupTierRanges(tiers).map((tier) => tier.label)).toEqual(["1–3", "4–5", "6+"]);
  });

  it("charges Luxor and Cairo per person at the group-size rate", () => {
    expect(booking("luxor-private-day-trip", 2).amount).toBe(341.98);
    expect(booking("luxor-private-day-trip", 4).amount).toBe(592.76);
    expect(booking("luxor-private-day-trip", 6).pricingSnapshot.trips[0].lines[0]).toMatchObject({ kind: "adults", quantity: 6, unitPrice: 113.99 });
    expect(booking("cairo-giza-day-trip-bus", 5).amount).toBe(797.95);
  });

  it("keeps group rates code-controlled so the CMS cannot pin an old price", () => {
    for (const slug of ["luxor-private-day-trip", "cairo-giza-day-trip-bus"]) {
      const tour = tours.find((item) => item.slug === slug);
      expect(codeControlledTourFields(tour)).toMatchObject({ groupPricing: tour?.groupPricing, price: tour?.price });
    }
  });
});
