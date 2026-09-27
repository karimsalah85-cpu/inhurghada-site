import { describe, expect, it } from "vitest";
import { tours } from "@/data/tours";
import { calculateBookingPrice } from "@/lib/booking-pricing";
import { normalizeTourPricing, mergeTourPricing } from "@/lib/tour-pricing";
import { codeControlledTourFields } from "@/lib/live-content";
import { localizeTour } from "@/lib/tour-localization";
import { locales } from "@/lib/i18n";

const rates: Record<string, number[]> = {
  "luxor-private-day-trip": [180, 156, 120], "luxor-two-day-trip": [300, 279, 264],
  "cairo-giza-day-trip-bus": [192, 168, 156], "luxor-hot-air-balloon": [90],
  "orange-bay": [26.5], "hula-hula-island-snorkeling": [26.5],
  "dolphin-house-snorkeling": [26.5], "paradise-island": [42], "safari": [24], "super-safari": [30],
};
const input = { type: "tour" as const, tourName: "", adults: 2, youth: 0, infants: 0, service: "", pickup: "", dropoff: "", passengers: 0, travelBags: 0 };

describe("September 27 owner prices", () => {
  it.each(Object.entries(rates))("keeps %s rates in EUR through CMS and every locale", (slug, prices) => {
    const source = tours.find(t => t.slug === slug)!;
    const merged = normalizeTourPricing({ ...source, price: "999", participantPricing: { adults: 888 }, ...codeControlledTourFields(source) });
    for (const locale of locales) {
      const tour = localizeTour(merged, locale);
      expect(tour.currency).toBe("EUR");
      expect(Number(tour.price)).toBe(prices[0]);
      expect(tour.participantPricing?.adults ?? Number(tour.price)).toBe(prices[0]);
      prices.forEach((rate, index) => {
        const adults = [2, 4, 6][index];
        const quote = calculateBookingPrice({ ...input, tourSlug: slug, adults }, [tour]);
        expect(quote.data?.amount).toBe(rate * adults);
        expect(quote.data?.pricingSnapshot.currency).toBe("EUR");
      });
    }
  });
  it("rejects unsupported group sizes in direct and cart quotes", () => {
    for (const adults of [1, 9]) {
      expect(calculateBookingPrice({ ...input, tourSlug: "luxor-private-day-trip", adults }).error).toContain("2–8");
      expect(calculateBookingPrice({ ...input, tourSlug: "multi-trip", cartItems: [{ tourSlug: "luxor-two-day-trip", adults, youth: 0, infants: 0, date: "2026-12-01", time: "05:00", extras: [] }] }).error).toContain("2–8");
    }
  });
  it("aligns conflicting display, package and adult prices with the calculated fare", () => {
    const original = tours.find(t => t.slug === "orange-bay")!;
    const normalized = normalizeTourPricing({ ...original, price: "120", packagePrice: "100", participantPricing: { adults: 150 } });
    expect(normalized.price).toBe("150");
    expect(normalized.packagePrice).toBe("150");
    expect(calculateBookingPrice({ ...input, tourSlug: original.slug }, [normalized]).data?.amount).toBe(300);
    const cms = mergeTourPricing(original, { price: "27" });
    expect(normalizeTourPricing({ ...original, ...cms }).participantPricing?.adults).toBe(27);
  });
});

describe("selectable package price consistency", () => {
  it.each([["package-0", 25], ["package-1", 40], ["primary", 50]] as const)("quotes %s in direct and cart checkout", (selectedPackageOption, rate) => {
    const item = { tourSlug: "turkish-bath-spa", selectedPackageOption, adults: 2, youth: 0, infants: 0, extras: [], date: "2026-12-01", time: "09:00" };
    const direct = calculateBookingPrice({ ...input, ...item });
    const cart = calculateBookingPrice({ ...input, tourSlug: "multi-trip", cartItems: [item] });
    expect(direct.data?.amount).toBe(rate * 2);
    expect(cart.data?.amount).toBe(rate * 2);
    expect(direct.data?.pricingSnapshot.trips[0].lines[0].label).toBeTruthy();
  });
  it("preserves the hammam's distinct primary package and rejects forged options", () => {
    const spa = tours.find(t => t.slug === "turkish-bath-spa")!;
    expect(normalizeTourPricing(spa).packagePrice).toBe("50");
    expect(calculateBookingPrice({ ...input, tourSlug: spa.slug, selectedPackageOption: "fake" }).error).toMatch(/valid package/);
  });
  it("adds the same EUR ticket amount used by the form", () => {
    const quote = calculateBookingPrice({ ...input, tourSlug: "luxor-private-day-trip", extras: ["tutankhamun-ticket"] });
    expect(quote.data?.amount).toBe(386.3);
    expect(quote.data?.pricingSnapshot.trips[0].lines[1].unitPrice).toBe(26.3);
  });
});

 it("never restores old translated package prices", () => {
   const spa = tours.find(t => t.slug === "turkish-bath-spa")!;
   const updated = { ...spa, packagePrice: "60", additionalPackages: spa.additionalPackages!.map(pkg => ({ ...pkg, price: "45" })) };
   for (const locale of locales) {
     const localized = localizeTour(updated, locale);
     expect(localized.packagePrice).toBe("60");
     expect(localized.additionalPackages?.map(pkg => pkg.price)).toEqual(["45", "45"]);
   }
 });
