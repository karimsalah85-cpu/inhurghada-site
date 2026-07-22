import { describe, expect, it } from "vitest";
import { dictionaries, languageAlternates, localePath, locales } from "@/lib/i18n";

describe("localized routes", () => {
  it("has a complete dictionary for every supported locale", () => {
    const englishKeys = Object.keys(dictionaries.en).sort();
    for (const locale of locales) expect(Object.keys(dictionaries[locale]).sort()).toEqual(englishKeys);
  });

  it("builds canonical paths without duplicate slashes", () => {
    expect(localePath("en", "/tours/orange-bay")).toBe("/tours/orange-bay");
    expect(localePath("de", "/tours/orange-bay")).toBe("/de/tours/orange-bay");
    expect(localePath("ar")).toBe("/ar");
  });

  it("provides all language alternates", () => {
    expect(Object.keys(languageAlternates("/transfers"))).toEqual([...locales]);
  });
});
