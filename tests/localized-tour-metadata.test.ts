import { describe, expect, it } from "vitest";
import { generateMetadata } from "@/app/[locale]/[[...path]]/page";
import { tours } from "@/data/tours";
import { localizeTour } from "@/lib/tour-localization";
import type { Locale } from "@/lib/i18n";

const locales: Locale[] = ["en", "ar", "de", "ru", "pl", "zh"];

describe("localized tour metadata", () => {
  it("uses the Arabic Senzo SEO copy consistently across standard, Open Graph and Twitter metadata", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: "ar", path: ["tours", "senzo-transfer"] }) });
    expect(metadata.title).toContain("توصيل");
    expect(metadata.description).toContain("احجز");
    expect(metadata.openGraph?.title).toBe(metadata.title);
    expect(metadata.openGraph?.description).toBe(metadata.description);
    expect(metadata.twitter?.title).toBe(metadata.title);
    expect(metadata.twitter?.description).toBe(metadata.description);
    expect(metadata.alternates?.canonical).toBe("/ar/tours/senzo-transfer");
    expect(metadata.alternates?.languages).toMatchObject({ ar: "/ar/tours/senzo-transfer", en: "/tours/senzo-transfer", "x-default": "/tours/senzo-transfer" });
  });

  it.each(locales)("keeps %s visible tour copy aligned with social metadata", async (locale) => {
    const source = tours.find((tour) => tour.slug === "senzo-transfer")!;
    const visible = localizeTour(source, locale);
    const metadata = await generateMetadata({ params: Promise.resolve({ locale, path: ["tours", "senzo-transfer"] }) });
    expect(String(metadata.title)).toContain((visible.seoTitle || visible.title).split(" ")[0]);
    expect(metadata.openGraph?.title).toBe(metadata.title);
    expect(metadata.openGraph?.description).toBe(metadata.description);
    expect(metadata.twitter?.title).toBe(metadata.title);
    expect(metadata.twitter?.description).toBe(metadata.description);
  });
});
