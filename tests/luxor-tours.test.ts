import { describe, expect, it } from "vitest";
import { tours, type Tour } from "@/data/tours";
import { calculateBookingPrice } from "@/lib/booking-pricing";
import { localizeTour, localizeTourGerman } from "@/lib/tour-localization";

const find = (slug: string) => tours.find((tour) => tour.slug === slug)!;
const twoDay = find("luxor-two-day-trip");
const balloon = find("luxor-hot-air-balloon");
const price = (slug: string, adults: number) => calculateBookingPrice({ type: "tour", tourName: "", tourSlug: slug, adults, youth: 0, infants: 0, service: "", pickup: "", dropoff: "", passengers: 0, travelBags: 0 }).data!.amount;

// Every customer-facing field the English listing sets must be translated.
const translatedFields = ["title", "location", "duration", "category", "description", "highlights", "included", "notIncluded", "notes", "itinerary", "notSuitableFor", "faqs", "priceUnit", "packageName", "packageDescription", "packageLabel", "seoTitle", "metaDescription", "imageAlt"] as const;

describe("Luxor two-day trip and balloon ride", () => {
  it("are live Hurghada cultural listings with owned Luxor photos and SEO copy", () => {
    for (const tour of [twoDay, balloon]) {
      expect(tour).toMatchObject({ destinationSlug: "hurghada", category: "Cultural Day Trip", bookingMode: "direct", pricingLockedToCode: true });
      expect(tour.listingStatus).toBeUndefined();
      expect(tour.image).toBe("/images/owned/luxor-branded.jpg");
      expect(tour.seoTitle!.length).toBeLessThanOrEqual(60);
      expect(tour.metaDescription!.length).toBeLessThanOrEqual(155);
    }
  });

  it("prices the two-day trip by group size and the balloon per person", () => {
    expect([1, 3, 4, 5, 6, 8].map((adults) => price("luxor-two-day-trip", adults))).toEqual([284.98, 854.94, 1048.72, 1310.9, 1504.68, 2006.24]);
    expect(price("luxor-hot-air-balloon", 2)).toBe(170.98);
  });

  it("fully localizes every customer-facing field in each non-English language", () => {
    for (const listing of [twoDay, balloon]) {
      for (const locale of ["ar", "de", "ru", "pl", "zh"] as const) {
        const localized = localizeTour(listing, locale);
        for (const field of translatedFields) {
          if (listing[field as keyof Tour] === undefined) continue;
          expect(localized[field as keyof Tour], `${listing.slug} ${locale} ${field}`).not.toEqual(listing[field as keyof Tour]);
        }
      }
    }
  });

  it("localizes on category pages, which call the per-language helpers directly", () => {
    expect(localizeTourGerman(twoDay).title).toBe("Privater Zwei-Tages-Ausflug nach Luxor ab Hurghada");
  });
});
