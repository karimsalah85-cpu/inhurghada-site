import { describe, expect, it } from "vitest";
import { tours } from "@/data/tours";
import { locales } from "@/lib/i18n";
import { localizeTour } from "@/lib/tour-localization";
import { calculateBookingPrice } from "@/lib/booking-pricing";
import { validateBookingInput } from "@/lib/booking-validation";
import { destinationCopyByLocale } from "@/lib/destination-i18n";
import { getDestination } from "@/lib/destinations";
import { tourMinimumAge } from "@/lib/tour-booking";

const slug = "horse-riding-el-gouna";
const tour = tours.find((item) => item.slug === slug)!;
const pricingInput = { type: "tour" as const, tourName: "", tourSlug: slug, adults: 1, youth: 0, infants: 0, service: "", pickup: "", dropoff: "", passengers: 0, travelBags: 0 };
const booking = { idempotencyKey: "123e4567-e89b-42d3-a456-426614174000", type: "tour", customerName: "Test Guest", phone: "+20 100 000 0000", customerEmail: "guest@example.com", hotel: "Steigenberger Golf Resort, El Gouna", date: "2099-01-01", time: "08:00", tourName: tour.title, tourSlug: slug, adults: 2, youth: 1, infants: 0 };

describe("El Gouna destination", () => {
  it("is a live EUR destination with free El Gouna and El Ahyaa pickup", () => {
    const destination = getDestination("el-gouna");
    expect(destination).toMatchObject({ name: "El Gouna", status: "live", defaultCurrency: "EUR" });
    expect(destination?.pickupZones).toEqual([
      { name: "El Gouna hotels", supplement: 0, currency: "EUR" },
      { name: "El Ahyaa hotels", supplement: 0, currency: "EUR" },
    ]);
    for (const locale of locales) expect(destinationCopyByLocale["el-gouna"]?.[locale]?.heading).toBeTruthy();
  });
});

describe("El Gouna horse riding tour", () => {
  it("belongs to El Gouna with the confirmed schedule and EUR prices", () => {
    expect(tour).toMatchObject({ destinationSlug: "el-gouna", currency: "EUR", listingStatus: "active", bookingMode: "direct", category: "Outdoor Activity", duration: "2 Hours", price: "45" });
    expect(tour.participantPricing).toEqual({ adults: 45, youth: 22.5 });
    expect(tour.availableTimes).toEqual(["07:00", "08:00", "09:00"]);
    expect(tour.operatingWeekdays).toBeUndefined();
    expect(tour.image).toBe("/images/owned/el-gouna-horse-riding-sea-riders.jpg");
    expect(tour.galleryImages).toHaveLength(3);
    expect(tour.seoTitle!.length).toBeLessThanOrEqual(60);
    expect(tour.metaDescription!.length).toBeLessThanOrEqual(155);
  });

  it("charges children 50% of the adult price", () => {
    expect(calculateBookingPrice({ ...pricingInput, adults: 2, youth: 1 }).data).toMatchObject({ amount: 112.5, guests: 3 });
  });

  it("cannot be booked for children under 5", () => {
    expect(calculateBookingPrice({ ...pricingInput, adults: 1, infants: 1 }).error).toMatch(/infant pricing is not available/i);
    expect(tourMinimumAge(slug)).toBe(5);
    expect(validateBookingInput(booking).error).toBe("Every rider must be at least 5 years old.");
    expect(validateBookingInput({ ...booking, quadMinimumAgeConfirmed: true }).error).toBeUndefined();
    expect(validateBookingInput({ ...booking, tourSlug: "multi-trip", cartItems: [{ tourSlug: slug, date: "2099-01-01", time: "08:00", adults: 1, youth: 0, infants: 0 }] }).error).toBe("Every rider must be at least 5 years old.");
  });

  it("keeps the quad tours' 9-year minimum unchanged", () => {
    expect(validateBookingInput({ ...booking, tourSlug: "quad-safari-morning", tourName: "Morning Quad Bike Safari", youth: 0 }).error).toBe("Every quad-tour participant must be at least 9 years old.");
  });

  it("is fully translated in every locale", () => {
    for (const locale of locales.filter((item) => item !== "en")) {
      const localized = localizeTour(tour, locale);
      for (const field of ["title", "description", "seoTitle", "metaDescription", "packageName", "location", "duration"] as const) expect(localized[field], `${locale} ${field}`).not.toBe(tour[field]);
      for (const field of ["highlights", "included", "notIncluded", "notSuitableFor", "itinerary", "notes", "faqs", "whatsappContactNotes"] as const) {
        expect(localized[field], `${locale} ${field}`).toHaveLength(tour[field]!.length);
        expect(localized[field], `${locale} ${field}`).not.toEqual(tour[field]);
      }
      expect(localized.imageAlt).not.toBe(tour.imageAlt);
      expect(localized.galleryImageAlts).toHaveLength(3);
      expect(localized.participantPricing).toEqual(tour.participantPricing);
      expect(localized.availableTimes).toEqual(tour.availableTimes);
    }
  });
});
