import { describe, expect, it } from "vitest";
import { tours } from "@/data/tours";

describe("tour catalog publication safety", () => {
  it("keeps slugs unique", () => {
    const slugs = tours.map((tour) => tour.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("never exposes a zero-price tour as directly bookable", () => {
    expect(tours.filter((tour) => Number(tour.price) <= 0 && tour.bookingMode !== "inquiry")).toEqual([]);
  });

  it("gives every newly priced comparison tour usable conditions and a storefront image", () => {
    const comparisonSlugs = ["dolphin-house-snorkeling", "paradise-island", "magawish-speedboat", "royal-seascope-submarine", "beginner-scuba-diving", "padi-open-water-course", "ssi-open-water-course", "super-safari", "desert-stargazing", "horse-riding-sea-desert", "sahl-hasheesh-horse-riding", "cairo-giza-day-trip-bus", "cairo-day-trip-flight", "el-gouna-city-boat-tour", "turkish-bath-spa"];
    const comparisonTours = tours.filter((tour) => comparisonSlugs.includes(tour.slug));
    expect(comparisonTours).toHaveLength(comparisonSlugs.length);
    for (const tour of comparisonTours) {
      expect(Number(tour.price)).toBeGreaterThan(0);
      expect(tour.bookingMode).toBe("direct");
      expect(tour.image).toMatch(/^\/images\//);
      expect(tour.included?.length).toBeGreaterThan(0);
      expect(tour.notIncluded?.length).toBeGreaterThan(0);
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
});
