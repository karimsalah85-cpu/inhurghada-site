import { describe, expect, it } from "vitest";
import { locales, localeSwitchPath } from "@/lib/i18n";
import { liveFreeGuides } from "@/lib/free-guides";
import { getLocalizedFreeGuide } from "@/lib/free-guide-localized";
import { freeGuideUi } from "@/lib/free-guide-ui";
import { isKnownApplicationPath } from "@/lib/public-routes";
import { generateStaticParams } from "@/app/[locale]/[[...path]]/page";
import sitemap from "@/app/sitemap";

describe("multilingual free destination guides", () => {
  it("supports every live destination in all seven languages without untranslated content", () => {
    for (const locale of locales) {
      expect(freeGuideUi[locale].hubTitle).toBeTruthy();
      for (const guide of liveFreeGuides) {
        const translated = getLocalizedFreeGuide(guide.slug, locale);
        expect(translated).toBeDefined();
        expect(translated?.essentials).toHaveLength(guide.essentials.length);
        expect(translated?.freePlaces).toHaveLength(guide.freePlaces.length);
        expect(translated?.dayPlan).toHaveLength(guide.dayPlan.length);
        expect(translated?.freePlaces.map((place) => place.mapsQuery)).toEqual(guide.freePlaces.map((place) => place.mapsQuery));
      }
    }
  });

  it("preserves the guide being read when switching language", () => {
    expect(localeSwitchPath("/your-guide/hurghada", "de")).toBe("/de/your-guide/hurghada");
    expect(localeSwitchPath("/de/your-guide/marsa-alam", "ar")).toBe("/ar/your-guide/marsa-alam");
    expect(localeSwitchPath("/ar/your-guide/jeddah", "en")).toBe("/your-guide/jeddah");
  });

  it("allows the localized guide URLs through the public route guard", () => {
    for (const locale of locales) {
      const prefix = locale === "en" ? "" : `/${locale}`;
      expect(isKnownApplicationPath(`${prefix}/your-guide`)).toBe(true);
      for (const guide of liveFreeGuides) expect(isKnownApplicationPath(`${prefix}/your-guide/${guide.slug}`)).toBe(true);
    }
  });

  it("generates non-English pages for every destination", async () => {
    const params = await generateStaticParams();
    for (const locale of locales.filter((language) => language !== "en")) {
      expect(params.some((entry) => entry.locale === locale && entry.path.join("/") === "your-guide")).toBe(true);
      for (const guide of liveFreeGuides) {
        expect(params.some((entry) => entry.locale === locale && entry.path.join("/") === `your-guide/${guide.slug}`)).toBe(true);
      }
    }
  });

  it("includes reciprocal localized sitemap entries", async () => {
    const urls = new Set((await sitemap()).map((entry) => entry.url));
    for (const locale of locales) {
      const prefix = locale === "en" ? "" : `/${locale}`;
      expect(urls.has(`https://dailyredsea.com${prefix}/your-guide`)).toBe(true);
      for (const guide of liveFreeGuides) expect(urls.has(`https://dailyredsea.com${prefix}/your-guide/${guide.slug}`)).toBe(true);
    }
  });
});
