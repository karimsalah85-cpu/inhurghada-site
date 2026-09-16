import { describe, expect, it, vi } from "vitest";
import { tours, type Tour } from "@/data/tours";
import { locales } from "@/lib/i18n";
import { localizeTour } from "@/lib/tour-localization";
import { calculateBookingPrice } from "@/lib/booking-pricing";
import Home from "@/app/page";
import LocalizedPage from "@/app/[locale]/[[...path]]/page";
import TourPage from "@/app/tours/[slug]/page";
import TourPageShell from "@/components/tours/TourPageShell";
import { getLiveTours } from "@/lib/live-content";

vi.mock("@/lib/live-content", () => ({ getLiveTours: vi.fn(), getLiveBlogPosts: vi.fn(async () => []) }));
const original = tours.find(t => t.slug === "orange-bay")!;
const live: Tour = { ...original, price: "25", packagePrice: "25", participantPricing: { adults: 25, youth: 15, infants: 0 }, currency: "USD" };
const input = { type: "tour" as const, tourName: "", tourSlug: live.slug, adults: 1, youth: 0, infants: 0, service: "", pickup: "", dropoff: "", passengers: 0, travelBags: 0 };

describe("one tour price source", () => {
  it("passes the live catalogue into initial English and translated homepage HTML", async () => {
    vi.mocked(getLiveTours).mockResolvedValue([live]);
    expect((await Home()).props.initialTours).toEqual([live]);
    for (const locale of locales.filter(locale => locale !== "en")) {
      expect((await LocalizedPage({ params: Promise.resolve({ locale, path: [] }) })).props.initialTours).toEqual([live]);
    }
  });
  it.each(locales)("preserves live prices and booking units through %s localization", locale => {
    const tour = localizeTour(live, locale);
    expect(tour).toMatchObject({ price: live.price, packagePrice: live.packagePrice, participantPricing: live.participantPricing, currency: live.currency });
    expect(calculateBookingPrice(input, [tour]).data?.amount).toBe(Number(tour.price));
  });
  it("uses live adult and child prices for individual and cart quotes and immutable snapshots", () => {
    const quote = calculateBookingPrice({ ...input, adults: 2, youth: 1 }, [live]);
    expect(quote.data?.amount).toBe(65);
    expect(JSON.stringify(quote.data?.pricingSnapshot)).toContain('"unitPrice":25');
    const cart = calculateBookingPrice({ ...input, tourSlug: "multi-trip", cartItems: [{ tourSlug: live.slug, adults: 2, youth: 1, infants: 0, extras: [], date: "2026-12-01", time: "08:00" }] }, [live]);
    expect(cart.data?.amount).toBe(65);
    expect(calculateBookingPrice(input, []).error).toMatch(/valid tour/);
  });
  it("passes the live price into detail content and structured offer data", async () => {
    vi.mocked(getLiveTours).mockResolvedValue([live]);
    const page = await TourPage({ params: Promise.resolve({ slug: live.slug }) });
    expect(page.props.tour.price).toBe(live.price);
    const shell = TourPageShell({ tour: localizeTour(live, "en") });
    // Inspect the JSON-LD element without rendering client booking components.
    const scripts: string[] = [];
    function visit(value: unknown) {
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) { value.forEach(visit); return; }
      const element = value as { type?: unknown; props?: { type?: string; dangerouslySetInnerHTML?: { __html: string }; children?: unknown } };
      if (element.type === "script" && element.props?.type === "application/ld+json") scripts.push(element.props.dangerouslySetInnerHTML?.__html || "");
      visit(element.props?.children);
    }
    visit(shell);
    expect(scripts.join("")).toContain('"price":"25"');
    expect(scripts.join("")).not.toContain('"price":"30"');
  });
});
