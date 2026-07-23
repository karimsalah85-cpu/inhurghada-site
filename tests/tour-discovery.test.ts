import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { tours } from "@/data/tours";
import { getTourCategory, tourCategories } from "@/lib/tour-categories";

describe("tour discovery", () => {
  it("maps every published category slug to at least one real tour", () => {
    for (const category of tourCategories) {
      expect(getTourCategory(category.slug)?.slug).toBe(category.slug);
      expect(tours.filter(category.matches).length).toBeGreaterThan(0);
    }
  });

  it("publishes English and translated category pages in the sitemap", () => {
    const urls = new Set(sitemap().map((entry) => entry.url));
    for (const category of tourCategories) {
      expect(urls.has(`https://dailyredsea.com/hurghada/${category.slug}`)).toBe(true);
      expect(urls.has(`https://dailyredsea.com/ar/hurghada/${category.slug}`)).toBe(true);
      expect(urls.has(`https://dailyredsea.com/de/hurghada/${category.slug}`)).toBe(true);
    }
  });

  it("includes multilingual alternates on every indexed tour", () => {
    const entries = sitemap();
    for (const tour of tours) {
      const entry = entries.find((item) => item.url === `https://dailyredsea.com/tours/${tour.slug}`);
      expect(entry?.alternates?.languages?.en).toBe(`https://dailyredsea.com/tours/${tour.slug}`);
      expect(entry?.alternates?.languages?.ar).toBe(`https://dailyredsea.com/ar/tours/${tour.slug}`);
      expect(entry?.images).toEqual([`https://dailyredsea.com${tour.image}`]);
    }
  });
});
