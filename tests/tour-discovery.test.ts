import { beforeEach, describe, expect, it, vi } from "vitest";
import sitemap from "@/app/sitemap";
import { generateStaticParams as generateLocalizedStaticParams } from "@/app/[locale]/[[...path]]/page";
import { tours } from "@/data/tours";
import { getTourCategory, tourCategories } from "@/lib/tour-categories";

vi.mock("@/lib/live-content", () => ({
  getLiveTours: vi.fn(async () => tours),
}));

beforeEach(() => vi.clearAllMocks());

describe("tour discovery", () => {
  it("keeps intentionally unlisted tours out of public discovery", () => {
    expect(tours.filter((tour) => tour.listingStatus === "unlisted").map((tour) => tour.slug)).toEqual(expect.arrayContaining([
      "royal-seascope-submarine",
      "sahl-hasheesh-horse-riding",
      "el-gouna-city-boat-tour",
      "cairo-day-trip-flight",
      "orange-bay-full-day-speedboat",
    ]));
  });

  it("does not pre-render localized routes for unlisted tours", async () => {
    const localizedPaths = await generateLocalizedStaticParams();
    for (const tour of tours.filter((item) => item.listingStatus === "unlisted")) {
      expect(localizedPaths.some((item) => item.path.join("/") === `tours/${tour.slug}`)).toBe(false);
    }
  });

  it("maps every published category slug to at least one real tour", () => {
    for (const category of tourCategories) {
      expect(getTourCategory(category.slug)?.slug).toBe(category.slug);
      expect(tours.filter(category.matches).length).toBeGreaterThan(0);
    }
  });

  it("publishes English and translated category pages in the sitemap", async () => {
    const urls = new Set((await sitemap()).map((entry) => entry.url));
    for (const category of tourCategories) {
      expect(urls.has(`https://dailyredsea.com/hurghada/${category.slug}`)).toBe(true);
      expect(urls.has(`https://dailyredsea.com/ar/hurghada/${category.slug}`)).toBe(true);
      expect(urls.has(`https://dailyredsea.com/de/hurghada/${category.slug}`)).toBe(true);
    }
  });

  it("publishes the English-only marine-life guide without false locale alternates", async () => {
    const entries = await sitemap();
    const guide = entries.find((entry) => entry.url === "https://dailyredsea.com/hurghada/marine-life");
    expect(guide?.alternates?.languages).toEqual({
      en: "https://dailyredsea.com/hurghada/marine-life",
      "x-default": "https://dailyredsea.com/hurghada/marine-life",
    });
    expect(entries.some((entry) => entry.url === "https://dailyredsea.com/de/hurghada/marine-life")).toBe(false);
  });

  it("includes multilingual alternates on every indexed tour", async () => {
    const entries = await sitemap();
    for (const tour of tours.filter((item) => item.listingStatus !== "paused" && item.listingStatus !== "unlisted")) {
      const entry = entries.find((item) => item.url === `https://dailyredsea.com/tours/${tour.slug}`);
      expect(entry?.alternates?.languages?.en).toBe(`https://dailyredsea.com/tours/${tour.slug}`);
      expect(entry?.alternates?.languages?.ar).toBe(`https://dailyredsea.com/ar/tours/${tour.slug}`);
      expect(entry?.images).toEqual([`https://dailyredsea.com${tour.image}`]);
    }
    for (const tour of tours.filter((item) => item.listingStatus === "paused" || item.listingStatus === "unlisted")) {
      expect(entries.some((item) => item.url === `https://dailyredsea.com/tours/${tour.slug}`)).toBe(false);
    }
  });
});
