import { describe, expect, it } from "vitest";
import { tours } from "@/data/tours";
import { localizeTourArabic, localizeTourGerman, localizeTourRussian } from "@/lib/tour-localization";
import { filterTours } from "@/lib/tour-search";

const slugs = (query: string, source = tours) => filterTours(source, query).map((tour) => tour.slug);

describe("multilingual tour search", () => {
  it("matches English tours and transfers", () => {
    expect(slugs("diving")).toContain("full-day-diving");
    expect(slugs("airport transfer")).toContain("hurghada-airport-transfer");
    expect(slugs("desert sunset")).toContain("quad-safari-sunset");
  });

  it("matches German terms on localized tours", () => {
    const germanTours = tours.map(localizeTourGerman);
    expect(slugs("Tauchen", germanTours)).toContain("full-day-diving");
    expect(slugs("Flughafen Transfer", germanTours)).toContain("hurghada-airport-transfer");
    expect(slugs("Wüste Sonnenuntergang", germanTours)).toContain("quad-safari-sunset");
  });

  it("matches Russian terms on localized tours", () => {
    const russianTours = tours.map(localizeTourRussian);
    expect(slugs("дайвинг", russianTours)).toContain("full-day-diving");
    expect(slugs("аэропорт трансфер", russianTours)).toContain("hurghada-airport-transfer");
    expect(slugs("пустыня закат", russianTours)).toContain("quad-safari-sunset");
  });

  it("matches Arabic terms on localized tours", () => {
    const arabicTours = tours.map(localizeTourArabic);
    expect(slugs("غوص", arabicTours)).toContain("full-day-diving");
    expect(slugs("مطار توصيل", arabicTours)).toContain("hurghada-airport-transfer");
    expect(slugs("صحراء غروب", arabicTours)).toContain("quad-safari-sunset");
  });

  it("is case-insensitive, accent-insensitive, and clears to all tours", () => {
    expect(slugs("ОСТРОВ")).toContain("orange-bay");
    expect(slugs("WÜSTE")).toContain("safari");
    expect(filterTours(tours, "")).toHaveLength(tours.length);
  });
});
