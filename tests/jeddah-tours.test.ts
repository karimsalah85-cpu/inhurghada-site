import { describe, expect, it } from "vitest";
import { tours } from "@/data/tours";
import { getDestination } from "@/lib/destinations";
import { applyTourMediaSafety } from "@/lib/tour-media-safety";
import { localizeTour } from "@/lib/tour-localization";
import { getTourCategory } from "@/lib/tour-categories";

describe("Jeddah destination", () => {
  it("maps the live diving and yacht inventory to dedicated category hubs", () => {
    const diving = getTourCategory("diving-snorkeling");
    const cruises = getTourCategory("boat-cruises");
    const jeddahTours = tours.filter((tour) => tour.destinationSlug === "jeddah");
    expect(jeddahTours.filter((tour) => diving?.matches(tour)).map((tour) => tour.slug)).toEqual(expect.arrayContaining(["basic-diver-jeddah", "certified-diver-boat-trip-jeddah"]));
    expect(jeddahTours.filter((tour) => cruises?.matches(tour)).map((tour) => tour.slug)).toContain("jeddah-yacht-sunset-cruise");
  });
  it("publishes Jeddah with SAR pricing and its first active listing", () => {
    const destination = getDestination("jeddah");
    const listing = tours.find((tour) => tour.slug === "basic-diver-jeddah");

    expect(destination).toMatchObject({ status: "live", defaultCurrency: "SAR", country: "Saudi Arabia" });
    expect(listing).toMatchObject({ destinationSlug: "jeddah", currency: "SAR", price: "468", originalPrice: "550", listingStatus: "active" });
    expect(listing?.availableTimes).toEqual(["10:15 AM", "11:00 AM", "12:00 AM"]);
  });

  it("keeps the supplied Basic Diver artwork assigned to the listing", () => {
    const listing = tours.find((tour) => tour.slug === "basic-diver-jeddah");
    expect(applyTourMediaSafety(listing!).image).toBe("/images/owned/basic-diver-jeddah.jpg");
  });

  it("publishes the supplied Shorouk Sat sunset cruise without exposing the unavailable evening slot", () => {
    const listing = tours.find((tour) => tour.slug === "jeddah-yacht-sunset-cruise");

    expect(listing).toMatchObject({
      destinationSlug: "jeddah",
      currency: "SAR",
      price: "102",
      originalPrice: "120",
      listingStatus: "active",
      participantPricing: { adults: 102, youth: 51, infants: 0 },
      operatingWeekdays: [1, 3, 4],
      availableTimes: ["5:00 PM sunset cruise"],
    });
    expect(listing?.availableTimes).not.toContain("7:00 PM evening cruise");
    expect(applyTourMediaSafety(listing!).image).toBe("/images/owned/jeddah-yacht-sunset-cruise.jpg");
  });

  it("fully localizes every customer-facing yacht field in each available non-English language", () => {
    const listing = tours.find((tour) => tour.slug === "jeddah-yacht-sunset-cruise")!;
    const expectedPriceUnits = { ar: "للبالغ", de: "pro Erwachsenem", ru: "за взрослого", pl: "za osobę dorosłą", zh: "每位成人" } as const;

    for (const locale of ["ar", "de", "ru", "pl", "zh"] as const) {
      const localized = localizeTour(listing, locale);
      expect(localized.title).not.toBe(listing.title);
      expect(localized.description).not.toBe(listing.description);
      expect(localized.highlights).not.toEqual(listing.highlights);
      expect(localized.included).not.toEqual(listing.included);
      expect(localized.notIncluded).not.toEqual(listing.notIncluded);
      expect(localized.notes).not.toEqual(listing.notes);
      expect(localized.itinerary).not.toEqual(listing.itinerary);
      expect(localized.notSuitableFor).not.toEqual(listing.notSuitableFor);
      expect(localized.whatToBring).not.toEqual(listing.whatToBring);
      expect(localized.faqs).not.toEqual(listing.faqs);
      expect(localized.ageBands).not.toEqual(listing.ageBands);
      expect(localized.availableTimes).not.toEqual(listing.availableTimes);
      expect(localized.priceUnit).toBe(expectedPriceUnits[locale]);
      expect(localized.departureMarina).not.toBe(listing.departureMarina);
      expect(localized.categoryPath).not.toEqual(listing.categoryPath);
      expect(localized.seoTitle).not.toBe(listing.seoTitle);
      expect(localized.metaDescription).not.toBe(listing.metaDescription);
      expect(localized.imageAlt).not.toBe(listing.imageAlt);
    }
  });
});
