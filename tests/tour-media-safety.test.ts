import { describe, expect, it } from "vitest";
import { tours } from "@/data/tours";
import { applyTourMediaSafety } from "@/lib/tour-media-safety";

const protectedSlugs = ["quad-safari-morning", "quad-safari-sunset", "senzo-transfer", "dolphin-house-snorkeling", "horse-riding-sea-desert", "sahl-hasheesh-horse-riding", "cairo-giza-day-trip-bus", "cairo-day-trip-flight", "el-gouna-city-boat-tour", "turkish-bath-spa"];

describe("tour media safety", () => {
  it("uses original category artwork and no legacy galleries for every protected product", () => {
    for (const slug of protectedSlugs) {
      const tour = tours.find((item) => item.slug === slug);
      expect(tour?.image).toMatch(/^\/images\/placeholders\/.+\.svg$/);
      expect(tour?.galleryImages).toEqual([]);
      expect(tour?.imageAlt).toMatch(/Illustrated placeholder/);
    }
  });

  it("overrides unsafe live media while preserving non-media product fields", () => {
    const original = tours.find((item) => item.slug === "senzo-transfer")!;
    const safe = applyTourMediaSafety({ ...original, title: "Managed title", image: "https://example.com/unverified.jpg", galleryImages: ["/unsafe.jpg"] }, "ar");
    expect(safe.title).toBe("Managed title");
    expect(safe.image).toBe("/images/placeholders/senzo-transfer.svg");
    expect(safe.galleryImages).toEqual([]);
    expect(safe.imageAlt).toContain("سنزو");
  });

  it("leaves unaffected tours unchanged", () => {
    const original = tours.find((item) => item.slug === "orange-bay")!;
    expect(applyTourMediaSafety(original)).toBe(original);
  });
});
