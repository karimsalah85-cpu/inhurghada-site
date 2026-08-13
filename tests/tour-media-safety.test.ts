import { describe, expect, it } from "vitest";
import { tours } from "@/data/tours";
import { applyTourMediaSafety } from "@/lib/tour-media-safety";

describe("tour media safety", () => {
  it("uses verified owned photos only where the supplied image matches the product", () => {
    expect(tours.find((item) => item.slug === "dolphin-house-snorkeling")?.image).toBe("/images/owned/dolphin-house-pod.jpg");
    expect(tours.find((item) => item.slug === "senzo-transfer")?.image).toBe("/images/owned/senzo-mall.jpg");
    expect(tours.find((item) => item.slug === "quad-safari-morning")?.image).toBe("/images/owned/quad-safari-morning.jpg");
    expect(tours.find((item) => item.slug === "cairo-giza-day-trip-bus")?.image).toBe("/images/owned/cairo-giza-day.jpg");
    expect(tours.find((item) => item.slug === "beginner-scuba-diving")?.image).toBe("/images/owned/diving-training-seabed.jpg");
    expect(tours.find((item) => item.slug === "padi-open-water-course")?.image).toBe("/images/owned/diving-training-seabed.jpg");
    expect(tours.find((item) => item.slug === "ssi-open-water-course")?.image).toBe("/images/owned/diving-training-seabed.jpg");
    expect(tours.find((item) => item.slug === "luxor-private-day-trip")?.image).toBe("/images/owned/luxor-branded.jpg");

    expect(tours.find((item) => item.slug === "horse-riding-sea-desert")?.image).toBe("/images/hurghada-island-family-sunset.jpeg");
    expect(tours.find((item) => item.slug === "turkish-bath-spa")?.image).toBe("/images/hero.jpg");

    for (const slug of ["sahl-hasheesh-horse-riding", "el-gouna-city-boat-tour"]) {
      expect(tours.find((item) => item.slug === slug)?.image).toMatch(/^\/images\/placeholders\/.+\.svg$/);
    }
  });

  it("restores the requested owner-supplied activity photography", () => {
    expect(tours.find((item) => item.slug === "safari")?.galleryImages).toContain("/images/owned/desert-camel-profile.jpg");
    expect(tours.find((item) => item.slug === "quad-safari-sunset")?.image).toBe("/images/owned/quad-safari-morning.jpg");
    expect(tours.find((item) => item.slug === "hurghada-airport-transfer")?.image).toBe("/images/owned/hurghada-airport-sunset.jpg");
    expect(tours.find((item) => item.slug === "professional-underwater-photographer")?.image).toBe("/images/owned/red-sea-diver-fish.jpg");
    expect(tours.find((item) => item.slug === "full-day-snorkeling")?.image).toBe("/images/owned/red-sea-reef-panorama.jpg");
    expect(tours.find((item) => item.slug === "mahmya-island")?.image).toBe("/images/owned/mahmya-boats-sunset.jpg");
    for (const tour of tours.filter((item) => item.slug.includes("speedboat"))) {
      expect(tour.image).toBe("/images/owned/speedboat-action-wide.jpg");
    }
  });

  it("uses the owner-supplied Luxor artwork and temple gallery without the unrelated boat", () => {
    const luxor = tours.find((item) => item.slug === "luxor-private-day-trip")!;
    expect(luxor.galleryImages).toEqual([
      "/images/owned/luxor-temple-facade.jpg",
      "/images/owned/luxor-temple-reliefs.jpg",
      "/images/owned/luxor-temple-columns.jpg",
      "/images/owned/luxor-hieroglyphs.jpg",
    ]);
    expect(luxor.galleryImages).not.toContain("/images/owned/luxor-boat.jpg");
  });

  it("uses the new owner-supplied training and reef images only in diving galleries", () => {
    const training = tours.find((item) => item.slug === "beginner-scuba-diving")!;
    expect(training.galleryImages).toEqual([
      "/images/owned/diving-training-instructor.jpg",
      "/images/owned/diving-group-surface.jpg",
      "/images/owned/red-sea-coral-closeup.jpg",
    ]);
    expect(tours.find((item) => item.slug === "full-day-diving")?.galleryImages).toContain("/images/owned/diving-group-surface.jpg");
  });

  it("overrides unsafe live media while preserving non-media product fields", () => {
    const original = tours.find((item) => item.slug === "senzo-transfer")!;
    const safe = applyTourMediaSafety({ ...original, title: "Managed title", image: "https://example.com/unverified.jpg", galleryImages: ["/unsafe.jpg"] }, "ar");
    expect(safe.title).toBe("Managed title");
    expect(safe.image).toBe("/images/owned/senzo-mall.jpg");
    expect(safe.galleryImages).toEqual([]);
    expect(safe.imageAlt).toContain("Senzo Mall");
  });

  it("keeps activities without matching owner photography on an original placeholder", () => {
    const original = tours.find((item) => item.slug === "el-gouna-city-boat-tour")!;
    expect(applyTourMediaSafety(original).image).toMatch(/^\/images\/placeholders\//);
  });

  it("publishes only approved repository photography or original placeholders", () => {
    const restoredImages = new Set(["/images/hurghada-island-family-sunset.jpeg", "/images/hero.jpg"]);
    for (const tour of tours) {
      expect(tour.image.match(/^\/images\/(owned\/.+\.jpg|placeholders\/.+\.svg)$/) || restoredImages.has(tour.image)).toBeTruthy();
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
