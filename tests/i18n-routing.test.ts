import { describe, expect, it } from "vitest";
import { languageAlternates, localeFromPathname, localeSwitchPath } from "@/lib/i18n";

describe("localized SEO routing", () => {
  it("treats the URL as the source of truth for rendered language", () => {
    expect(localeFromPathname("/ar")).toBe("ar");
    expect(localeFromPathname("/de/tours/orange-bay")).toBe("de");
    expect(localeFromPathname("/")).toBe("en");
    expect(localeFromPathname("/tours/orange-bay")).toBe("en");
  });

  it("switches to canonical unprefixed English without a redirect hop", () => {
    expect(localeSwitchPath("/de/tours/orange-bay", "en")).toBe("/tours/orange-bay");
  });

  it("preserves every supported transactional route", () => {
    expect(localeSwitchPath("/cart", "pl")).toBe("/pl/cart");
    expect(localeSwitchPath("/ar/booking/confirmation", "de")).toBe("/de/booking/confirmation");
  });

  it("falls back clearly to the selected home page when no equivalent exists", () => {
    expect(localeSwitchPath("/blog/orange-bay-guide", "ar")).toBe("/ar");
  });

  it("builds a reciprocal alternate set for canonical routes", () => {
    expect(languageAlternates("/tours/orange-bay")).toEqual({
      en: "/tours/orange-bay", ar: "/ar/tours/orange-bay", de: "/de/tours/orange-bay",
      ru: "/ru/tours/orange-bay", pl: "/pl/tours/orange-bay", zh: "/zh/tours/orange-bay",
    });
  });
});
