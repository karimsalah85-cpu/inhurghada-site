import { describe, expect, it } from "vitest";
import { generateMetadata } from "@/app/[locale]/[[...path]]/page";
import { tours } from "@/data/tours";
import { instagramUrl } from "@/lib/contact";
import { localizeTour } from "@/lib/tour-localization";
import type { Locale } from "@/lib/i18n";

describe("website fixes 2026-10-27", () => {
  it("links to the real Instagram account", () => {
    expect(instagramUrl).toBe("https://www.instagram.com/dailyredsea/");
  });

  it("does not show seed review counts that have no approved reviews behind them", () => {
    for (const slug of ["orange-bay", "professional-underwater-photographer"]) {
      const tour = tours.find((item) => item.slug === slug);
      expect(tour, slug).toBeDefined();
      expect(Number(tour!.reviews) > 0, slug).toBe(false);
    }
  });

  it("titles the German sunset quad page in German, not with the inherited English SEO title", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: "de", path: ["tours", "quad-safari-sunset"] }) });
    expect(String(metadata.title)).not.toContain("Sunset Quad Bike Safari in Hurghada Desert");
    expect(String(metadata.title)).toContain("Sonnenuntergang");
  });

  it("never leaves a translated tour with the untouched English SEO title", () => {
    const locales: Locale[] = ["de", "ru", "pl", "ar", "zh"];
    for (const tour of tours) {
      if (!tour.seoTitle) continue;
      for (const locale of locales) {
        const localized = localizeTour(tour, locale);
        if (localized.title !== tour.title) expect(localized.seoTitle, `${tour.slug}/${locale}`).not.toBe(tour.seoTitle);
      }
    }
  });

  it("keeps English SEO copy on English pages", () => {
    const tour = tours.find((item) => item.slug === "quad-safari-sunset")!;
    expect(localizeTour(tour, "en").seoTitle).toBe(tour.seoTitle);
  });
});

describe("Orange Bay park fee disclosure", () => {
  it("lists the national park fee as not included in every language", () => {
    const tour = tours.find((item) => item.slug === "orange-bay")!;
    const locales: Locale[] = ["en", "de", "ru", "pl", "ar", "zh"];
    for (const locale of locales) {
      const localized = localizeTour(tour, locale);
      expect(localized.notIncluded.some((item) => /5/.test(item)), locale).toBe(true);
    }
  });
});
