import { describe, expect, it } from "vitest";
import { tours } from "@/data/tours";
import { locales } from "@/lib/i18n";
import { localizeTour } from "@/lib/tour-localization";
import { validateTourSchedule } from "@/lib/booking-validation";
import { marsaAlamTourSchedules } from "@/data/tour-schedules";

const slugs = ["dolphin-house-marsa-alam", "marsa-mubarak-snorkeling", "abu-dabbab-snorkeling"];

describe("Marsa Alam controlled-preview tours", () => {
  it("keeps destination ownership, EUR prices, unresolved child bands, and booking disabled", () => {
    const selected = tours.filter((tour) => slugs.includes(tour.slug));
    expect(selected).toHaveLength(3);
    expect(selected.map((tour) => [tour.destinationSlug, tour.currency, tour.listingStatus])).toEqual([
      ["marsa-alam", "EUR", "paused"], ["marsa-alam", "EUR", "paused"], ["marsa-alam", "EUR", "paused"],
    ]);
    expect(selected.map((tour) => tour.participantPricing)).toEqual([
      { adults: 99, youth: 50 }, { adults: 60, youth: 40 }, { adults: 50, youth: 30 },
    ]);
    expect(selected.every((tour) => tour.participantPricing?.infants === undefined && tour.bookingBlocker)).toBe(true);
  });

  it("uses one authoritative recurring schedule and rejects unavailable weekdays", () => {
    expect(marsaAlamTourSchedules["dolphin-house-marsa-alam"].operatingWeekdays).toEqual([1, 5]);
    expect(marsaAlamTourSchedules["marsa-mubarak-snorkeling"].operatingWeekdays).toEqual([0, 2, 3, 4, 6]);
    expect(marsaAlamTourSchedules["abu-dabbab-snorkeling"].operatingWeekdays).toEqual([1, 3, 5]);
    expect(validateTourSchedule(marsaAlamTourSchedules["dolphin-house-marsa-alam"], "2026-08-17", new Date("2026-08-15T12:00:00Z")).valid).toBe(true);
    expect(validateTourSchedule(marsaAlamTourSchedules["dolphin-house-marsa-alam"], "2026-08-18", new Date("2026-08-15T12:00:00Z")).valid).toBe(false);
  });

  it("enforces the assumed previous-day 18:00 Cairo cutoff", () => {
    const schedule = marsaAlamTourSchedules["abu-dabbab-snorkeling"];
    expect(validateTourSchedule(schedule, "2026-08-17", new Date("2026-08-16T14:59:00Z")).valid).toBe(true);
    expect(validateTourSchedule(schedule, "2026-08-17", new Date("2026-08-16T15:00:00Z")).valid).toBe(false);
  });

  it("provides localized, destination-safe owner media in every locale", () => {
    for (const locale of locales) for (const slug of slugs) {
      const tour = localizeTour(tours.find((item) => item.slug === slug)!, locale);
      expect(tour.destinationSlug).toBe("marsa-alam");
      expect(tour.image).toBe("/images/owned/red-sea-reef-panorama.jpg");
      expect(tour.imageAlt).toBeTruthy();
      expect(tour.title).toBeTruthy();
      expect(tour.metaDescription).toBeTruthy();
    }
  });
});
