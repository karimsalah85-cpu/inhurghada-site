import { describe, expect, it } from "vitest";
import { tours } from "@/data/tours";
import { applyTourMediaSafety } from "@/lib/tour-media-safety";

describe("tour media safety", () => {
  it("uses verified owned photos only where the supplied image matches the product", () => {
    expect(tours.find((item) => item.slug === "dolphin-house-snorkeling")?.image).toBe("/images/owned/dolphin-house-pod.jpg");
    expect(tours.find((item) => item.slug === "senzo-transfer")?.image).toBe("/images/owned/senzo-mall.jpg");
    expect(tours.find((item) => item.slug === "quad-safari-morning")?.image).toBe("/images/owned/quad-safari-morning.jpg");
    expect(tours.find((item) => item.slug === "cairo-giza-day-trip-bus")?.image).toBe("/images/owned/cairo-giza-day.jpg");

    for (const slug of ["quad-safari-sunset", "horse-riding-sea-desert", "sahl-hasheesh-horse-riding", "el-gouna-city-boat-tour", "turkish-bath-spa"]) {
      expect(tours.find((item) => item.slug === slug)?.image).toMatch(/^\/images\/placeholders\/.+\.svg$/);
    }
  });

  it("overrides unsafe live media while preserving non-media product fields", () => {
    const original = tours.find((item) => item.slug === "senzo-transfer")!;
    const safe = applyTourMediaSafety({ ...original, title: "Managed title", image: "https://example.com/unverified.jpg", galleryImages: ["/unsafe.jpg"] }, "ar");
    expect(safe.title).toBe("Managed title");
    expect(safe.image).toBe("/images/owned/senzo-mall.jpg");
    expect(safe.galleryImages).toEqual([]);
    expect(safe.imageAlt).toContain("Senzo Mall");
  });

  it("leaves unaffected tours unchanged", () => {
    const original = tours.find((item) => item.slug === "orange-bay")!;
    expect(applyTourMediaSafety(original).image).toMatch(/^\/images\/placeholders\//);
  });

  it("publishes only owned photography or repository-original placeholders", () => {
    for (const tour of tours) {
      expect(tour.image).toMatch(/^\/images\/(owned\/.+\.jpg|placeholders\/.+\.svg)$/);
      for (const image of tour.galleryImages || []) expect(image).toMatch(/^\/images\/owned\/.+\.jpg$/);
    }
  });

  it("keeps the wildlife disclaimer and strips unverified live galleries", () => {
    const original = tours.find((item) => item.slug === "dolphin-house-snorkeling")!;
    const safe = applyTourMediaSafety({ ...original, image: "https://example.com/unverified.jpg", galleryImages: ["/unsafe.jpg"] });
    expect(safe.imageAlt).toContain("not guaranteed");
    expect(safe.galleryImages).toHaveLength(3);
    expect(safe.galleryImages).not.toContain("/unsafe.jpg");
  });
});
