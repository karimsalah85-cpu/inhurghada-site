import { describe, expect, it } from "vitest";
import { dictionaries, languageAlternates, localePath, locales } from "@/lib/i18n";
import { localizeProductBadge, publicInterfaceCopy } from "@/lib/public-interface-i18n";

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

  it("provides translated shared-interface copy for every locale", () => {
    const keys = Object.keys(publicInterfaceCopy.en).sort();
    for (const locale of locales) {
      expect(Object.keys(publicInterfaceCopy[locale]).sort()).toEqual(keys);
      expect(Object.values(publicInterfaceCopy[locale]).every(Boolean)).toBe(true);
    }
    expect(publicInterfaceCopy.ar.skip).toBe("انتقل إلى المحتوى الرئيسي");
    expect(publicInterfaceCopy.de.accept).toBe("Alle akzeptieren");
    expect(publicInterfaceCopy.zh.currency).toBe("显示货币");
  });

  it("localizes supported product badges without changing unknown operator labels", () => {
    expect(localizeProductBadge("ar", "Most Popular")).toBe("الأكثر شعبية");
    expect(localizeProductBadge("pl", "New")).toBe("Nowość");
    expect(localizeProductBadge("zh", "Premium")).toBe("尊享");
    expect(localizeProductBadge("de", "Orange Bay")).toBe("Orange Bay");
  });

  it("builds locale-aware Marsa Alam and blog paths", () => {
    expect(localePath("ar", "/destinations/marsa-alam")).toBe("/ar/destinations/marsa-alam");
    expect(localePath("ar", "/blog")).toBe("/ar/blog");
  });
});
