import { describe, expect, it } from "vitest";
import { tours } from "@/data/tours";
import { localizeTour } from "@/lib/tour-localization";
import { preserveTourPrices } from "@/lib/tour-pricing";
import type { Locale } from "@/lib/i18n";

const mahmya = tours.find(tour => tour.slug === "mahmya-island")!;

describe("Mahmya program content", () => {
  it("keeps lunch and snorkeling conditional on the selected program", () => {
    const tour = localizeTour(mahmya, "en");
    expect(tour.included).toHaveLength(3);
    expect(tour.included).not.toEqual(expect.arrayContaining([expect.stringMatching(/lunch|snorkel|hotel/i)]));
    expect(tour.notIncluded).toEqual(expect.arrayContaining(["Buffet-style lunch", "Snorkeling trip"]));
    expect(tour.additionalPackages?.[0].included).toContainEqual(expect.stringMatching(/lunch/i));
    expect(tour.additionalPackages?.[0].notIncluded).toContain("Snorkeling trip");
    expect(tour.additionalPackages?.[1].included).toContainEqual(expect.stringMatching(/Sabina Reef/));
    expect(tour.additionalPackages?.[1].notIncluded).toHaveLength(1);
  });

  it.each<Locale>(["en", "de", "ru", "ar", "zh", "pl"])("preserves all package prices and age bands in %s", locale => {
    const tour = localizeTour(mahmya, locale);
    expect(tour).toMatchObject({ currency: "EUR", price: "38", packagePrice: "38", participantPricing: { adults: 38, youth: 19, infants: 0 } });
    expect(tour.additionalPackages).toMatchObject([{ price: "60", youthPrice: 30 }, { price: "85", youthPrice: 42.5 }]);
    expect(tour.ageBands?.children).toContain("3–6");
    expect(tour.included).toHaveLength(3);
  });

  it("prevents stale translated child rates from overriding source rates", () => {
    const translated = { ...mahmya, additionalPackages: mahmya.additionalPackages?.map(pkg => ({ ...pkg, price: "999", youthPrice: 999 })) };
    expect(preserveTourPrices(mahmya, translated).additionalPackages).toMatchObject([{ price: "60", youthPrice: 30 }, { price: "85", youthPrice: 42.5 }]);
  });
});
