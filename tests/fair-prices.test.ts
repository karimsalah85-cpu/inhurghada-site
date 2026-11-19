import { describe, expect, it, vi } from "vitest";
import sitemap from "@/app/sitemap";
import { tours } from "@/data/tours";
import { convertAmount, fairPriceItems, fairPriceVerdict, fallbackFairPriceRates, formatFairRange } from "@/lib/fair-prices";

vi.mock("@/lib/live-content", () => ({
  getLiveTours: vi.fn(async () => tours),
  getLiveBlogPosts: vi.fn(async () => []),
}));

const rates = { USD: 1, EUR: 0.9, EGP: 50 };
const item = (id: string) => fairPriceItems.find((entry) => entry.id === id)!;

describe("fair price index", () => {
  it("has unique ids and coherent ranges", () => {
    expect(new Set(fairPriceItems.map((entry) => entry.id)).size).toBe(fairPriceItems.length);
    for (const entry of fairPriceItems) {
      expect(entry.fairMin).toBeGreaterThan(0);
      expect(entry.fairMax).toBeGreaterThanOrEqual(entry.fairMin);
      expect(entry.ripoffAbove).toBeGreaterThanOrEqual(entry.fairMax);
    }
  });

  it("links only to tours that exist in the catalogue", () => {
    const slugs = new Set(tours.map((tour) => tour.slug));
    for (const entry of fairPriceItems.filter((candidate) => candidate.tourSlug)) {
      expect(slugs.has(entry.tourSlug!)).toBe(true);
    }
  });

  it("grades a quoted price into the right band", () => {
    const taxi = item("airport-taxi-central");
    expect(fairPriceVerdict(taxi, 100, "EGP", rates)).toBe("below");
    expect(fairPriceVerdict(taxi, 500, "EGP", rates)).toBe("fair");
    expect(fairPriceVerdict(taxi, 900, "EGP", rates)).toBe("high");
    expect(fairPriceVerdict(taxi, 1500, "EGP", rates)).toBe("ripoff");
  });

  it("converts the quote into the item's currency before grading", () => {
    const orangeBay = item("orange-bay");
    // 1,500 EGP = $30 at 50 EGP/USD.
    expect(fairPriceVerdict(orangeBay, 1500, "EGP", rates)).toBe("fair");
    // €60 = $66.67, above the $55 rip-off line.
    expect(fairPriceVerdict(orangeBay, 60, "EUR", rates)).toBe("ripoff");
    // $10 is 500 EGP, inside the central-taxi range.
    expect(fairPriceVerdict(item("airport-taxi-central"), 10, "USD", rates)).toBe("fair");
  });

  it("treats any markup on a fixed official fee as a rip-off", () => {
    const visa = item("visa-on-arrival");
    expect(fairPriceVerdict(visa, 30, "USD", rates)).toBe("fair");
    expect(fairPriceVerdict(visa, 35, "USD", rates)).toBe("ripoff");
    expect(fairPriceVerdict(visa, convertAmount(30, "USD", "EGP", fallbackFairPriceRates), "EGP", fallbackFairPriceRates)).toBe("fair");
  });

  it("formats ranges and single fixed amounts", () => {
    expect(formatFairRange(item("visa-on-arrival"))).toBe("$30");
    expect(formatFairRange(item("orange-bay"))).toBe("$20 – $40");
  });

  it("is published in the sitemap as an English-only page", async () => {
    const entry = (await sitemap()).find((candidate) => candidate.url === "https://dailyredsea.com/hurghada/fair-prices");
    expect(entry?.alternates?.languages).toEqual({
      en: "https://dailyredsea.com/hurghada/fair-prices",
      "x-default": "https://dailyredsea.com/hurghada/fair-prices",
    });
  });
});
