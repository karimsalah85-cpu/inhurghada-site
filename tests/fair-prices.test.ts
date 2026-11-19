import { describe, expect, it, vi } from "vitest";
import sitemap from "@/app/sitemap";
import { tours } from "@/data/tours";
import { localizedFairPriceItems, fairPriceFaq } from "@/components/fair-prices/FairPriceIndex";
import {
  convertAmount,
  fairPriceItems,
  fairPriceItemsAt,
  fairPriceVerdict,
  fallbackFairPriceRates,
  formatFairRange,
  visaFeeUsd,
} from "@/lib/fair-prices";
import { fairPriceCopy, fillFairCopy } from "@/lib/fair-prices-i18n";
import { locales } from "@/lib/i18n";

vi.mock("@/lib/live-content", () => ({
  getLiveTours: vi.fn(async () => tours),
  getLiveBlogPosts: vi.fn(async () => []),
}));

const rates = { USD: 1, EUR: 0.9, EGP: 50 };
const beforeIncrease = new Date("2026-12-31T21:59:00Z"); // 23:59 in Cairo on 31 December
const afterIncrease = new Date("2026-12-31T22:00:00Z"); // midnight in Cairo on 1 January
const item = (id: string, now = beforeIncrease) => fairPriceItemsAt(now).find((entry) => entry.id === id)!;

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
    expect(fairPriceVerdict(item("orange-bay"), 1500, "EGP", rates)).toBe("fair");
    expect(fairPriceVerdict(item("orange-bay"), 60, "EUR", rates)).toBe("ripoff");
    expect(fairPriceVerdict(item("airport-taxi-central"), 10, "USD", rates)).toBe("fair");
  });

  it("switches the visa fee from $30 to $33 at midnight Cairo time on 1 January 2027", () => {
    expect(visaFeeUsd(beforeIncrease)).toBe(30);
    expect(visaFeeUsd(afterIncrease)).toBe(33);
    expect(fairPriceVerdict(item("visa-on-arrival", beforeIncrease), 30, "USD", rates)).toBe("fair");
    expect(fairPriceVerdict(item("visa-on-arrival", beforeIncrease), 33, "USD", rates)).toBe("ripoff");
    expect(fairPriceVerdict(item("visa-on-arrival", afterIncrease), 33, "USD", rates)).toBe("fair");
    expect(fairPriceVerdict(item("visa-on-arrival", afterIncrease), 35, "USD", rates)).toBe("ripoff");
    const visaInEgp = convertAmount(30, "USD", "EGP", fallbackFairPriceRates);
    expect(fairPriceVerdict(item("visa-on-arrival"), visaInEgp, "EGP", fallbackFairPriceRates)).toBe("fair");
  });

  it("warns about the increase before it happens and drops the warning afterwards", () => {
    const visaBefore = localizedFairPriceItems("en", beforeIncrease).find((entry) => entry.id === "visa-on-arrival")!;
    const visaAfter = localizedFairPriceItems("en", afterIncrease).find((entry) => entry.id === "visa-on-arrival")!;
    expect(visaBefore.tip).toContain("$33 on 1 January 2027");
    expect(visaAfter.tip).not.toContain("2027");
    expect(fairPriceFaq("en", afterIncrease)[1].answer).toContain("$33");
    expect(fairPriceFaq("en", afterIncrease)[1].answer).not.toContain("$30");
  });

  it("does not claim an outdated e-visa price", () => {
    for (const locale of locales) {
      const { visaTip } = fairPriceCopy[locale];
      expect(`${visaTip.beforeIncrease} ${visaTip.afterIncrease}`).not.toMatch(/25/);
    }
  });

  it("translates every item, category and placeholder for every locale", () => {
    for (const locale of locales) {
      const copy = fairPriceCopy[locale];
      for (const entry of fairPriceItems) {
        expect(copy.items[entry.id].name, `${locale} ${entry.id}`).toBeTruthy();
        expect(copy.items[entry.id].unit, `${locale} ${entry.id}`).toBeTruthy();
        if (entry.id !== "visa-on-arrival") expect(copy.items[entry.id].tip, `${locale} ${entry.id}`).toBeTruthy();
      }
      for (const entry of localizedFairPriceItems(locale, beforeIncrease)) expect(entry.tip).toBeTruthy();
      for (const answer of fairPriceFaq(locale, beforeIncrease)) expect(answer.answer).not.toMatch(/\{\w+\}/);
      expect(copy.checker.askMessage).toContain("{amount}");
      expect(copy.checker.askMessage).toContain("{name}");
      expect(copy.habits).toHaveLength(5);
    }
  });

  it("fills placeholders and formats ranges", () => {
    expect(fillFairCopy("{a} and {b}", { a: 1, b: "two" })).toBe("1 and two");
    expect(formatFairRange(item("visa-on-arrival"))).toBe("$30");
    expect(formatFairRange(item("orange-bay"))).toBe("$20 – $40");
  });

  it("is published in the sitemap in every language with matching alternates", async () => {
    const entries = await sitemap();
    const english = entries.find((candidate) => candidate.url === "https://dailyredsea.com/hurghada/fair-prices");
    expect(english?.alternates?.languages).toMatchObject({
      en: "https://dailyredsea.com/hurghada/fair-prices",
      de: "https://dailyredsea.com/de/hurghada/fair-prices",
      ar: "https://dailyredsea.com/ar/hurghada/fair-prices",
      "x-default": "https://dailyredsea.com/hurghada/fair-prices",
    });
    for (const locale of locales.filter((candidate) => candidate !== "en")) {
      expect(entries.some((candidate) => candidate.url === `https://dailyredsea.com/${locale}/hurghada/fair-prices`)).toBe(true);
    }
  });
});
