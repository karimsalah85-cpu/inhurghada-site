import { describe, expect, it } from "vitest";
import { tours } from "@/data/tours";
import { halfDayBoatOptions } from "@/data/speedboat-booking";

describe("tour catalog publication safety", () => {
  it("keeps slugs unique", () => {
    const slugs = tours.map((tour) => tour.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("never exposes a zero-price tour as directly bookable", () => {
    expect(tours.filter((tour) => Number(tour.price) <= 0 && tour.bookingMode !== "inquiry")).toEqual([]);
  });

  it("gives every newly priced comparison tour usable conditions and a storefront image", () => {
    const comparisonSlugs = ["dolphin-house-snorkeling", "hula-hula-island-snorkeling", "paradise-island", "magawish-speedboat", "royal-seascope-submarine", "beginner-scuba-diving", "padi-open-water-course", "ssi-open-water-course", "super-safari", "desert-stargazing", "horse-riding-sea-desert", "sahl-hasheesh-horse-riding", "cairo-giza-day-trip-bus", "cairo-day-trip-flight", "el-gouna-city-boat-tour", "turkish-bath-spa"];
    const comparisonTours = tours.filter((tour) => comparisonSlugs.includes(tour.slug));
    expect(comparisonTours).toHaveLength(comparisonSlugs.length);
    for (const tour of comparisonTours) {
      expect(Number(tour.price)).toBeGreaterThan(0);
      expect(tour.bookingMode).toBe("direct");
      expect(tour.image).toMatch(/^\/images\//);
      expect(tour.included?.length).toBeGreaterThan(0);
      if (tour.slug === "paradise-island") expect(tour.notIncluded).toEqual([]);
      else expect(tour.notIncluded?.length).toBeGreaterThan(0);
      expect(tour.notes?.length).toBeGreaterThan(0);
      expect(tour.availableTimes?.length).toBeGreaterThan(0);
    }
  });

  it("keeps SSI pricing transparent until a comparison source is verified", () => {
    const ssi = tours.find((tour) => tour.slug === "ssi-open-water-course");
    expect(ssi).toBeDefined();
    expect(ssi?.originalPrice).toBeUndefined();
    expect(ssi?.ageBands?.adults).toBe("Students (ages 10+)");
  });

  it("keeps yesterday's three new sea trips at the requested prices", () => {
    const dolphin = tours.find((tour) => tour.slug === "dolphin-house-snorkeling");
    const hulaHula = tours.find((tour) => tour.slug === "hula-hula-island-snorkeling");
    const magawish = tours.find((tour) => tour.slug === "magawish-speedboat");

    for (const tour of [dolphin, hulaHula]) {
      expect(tour?.price).toBe("25");
      expect(tour?.participantPricing).toEqual({ adults: 25, youth: 15, infants: 0 });
      expect(tour?.ageBands?.children).toBe("Youth (ages 4–10)");
    }
    expect(magawish?.price).toBe(String(halfDayBoatOptions[0].price));
    expect(magawish?.pricingMode).toBe("per-booking");
    expect(magawish?.notIncluded?.some((item) => item.includes("Orange Bay entrance") && item.includes("Magawish entrance"))).toBe(true);
  });

  it("prices both open-water courses at EUR 300 and excludes EUR 100 materials", () => {
    for (const slug of ["padi-open-water-course", "ssi-open-water-course"]) {
      const course = tours.find((tour) => tour.slug === slug);
      expect(course?.price).toBe("342.20");
      expect(course?.notIncluded?.some((item) => item.includes("€100"))).toBe(true);
      expect(course?.notes?.some((item) => item.includes("€300") && item.includes("€100"))).toBe(true);
    }
  });

  it("publishes all five private speedboat products with distinct boat tiers", () => {
    const slugs = ["orange-bay-half-day-speedboat", "orange-bay-full-day-speedboat", "paradise-island-speedboat", "hula-hula-speedboat", "magawish-speedboat"];
    for (const slug of slugs) {
      const tour = tours.find((item) => item.slug === slug);
      expect(tour?.bookingMode).toBe("direct");
      expect(tour?.boatOptions).toHaveLength(8);
      expect(tour?.category).toBe("Speedboat Trip");
      expect(tour?.price).toBe(String(tour?.boatOptions?.[0].price));
      expect(tour?.priceUnit).toBe("per private boat");
      expect(tour?.boatOptions?.filter((option) => option.capacity === 5)).toHaveLength(2);
      expect(tour?.showSpeedboatTerms).toBe(true);
      expect(tour?.galleryImages).toHaveLength(4);
    }
    expect(tours.find((tour) => tour.slug === "hula-hula-speedboat")?.requiresMarinaTransferChoice).not.toBe(true);
  });
});
