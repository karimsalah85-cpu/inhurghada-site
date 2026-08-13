import { describe, expect, it } from "vitest";
import { validateBookingInput } from "@/lib/booking-validation";

const valid = { idempotencyKey: "123e4567-e89b-42d3-a456-426614174000", type: "tour", customerName: "Test Guest", phone: "+20 100 000 0000", customerEmail: "guest@example.com", hotel: "Test Hotel", date: "2099-01-01", tourName: "Orange Bay Island Snorkeling Boat Trip", adults: 1 };

describe("booking input validation", () => {
  it("accepts and normalizes valid input", () => {
    const result = validateBookingInput(valid);
    expect(result.data).toMatchObject({ customerName: "Test Guest", customerEmail: "guest@example.com", currency: "usd" });
  });

  it("rejects arrays and empty payloads", () => {
    expect(validateBookingInput(null).error).toBeDefined();
    expect(validateBookingInput([]).error).toBeDefined();
  });

  it("requires a UUID v4 booking attempt key", () => {
    expect(validateBookingInput({ ...valid, idempotencyKey: "reused-string" }).error).toMatch(/attempt key/i);
  });

  it("silently accepts the honeypot as spam", () => {
    expect(validateBookingInput({ ...valid, website: "bot" }).spam).toBe(true);
  });

  it("rejects invalid contact details", () => {
    expect(validateBookingInput({ ...valid, customerName: "A" }).error).toBeDefined();
    expect(validateBookingInput({ ...valid, phone: "123" }).error).toBeDefined();
    expect(validateBookingInput({ ...valid, customerEmail: "bad" }).error).toBeDefined();
  });

  it("rejects malformed and past dates", () => {
    expect(validateBookingInput({ ...valid, date: "tomorrow" }).error).toBeDefined();
    expect(validateBookingInput({ ...valid, date: "2020-01-01" }).error).toMatch(/future/i);
  });

  it("ignores a client-supplied currency and amount", () => {
    const result = validateBookingInput({ ...valid, amount: 0.01, currency: "xxx" });
    expect(result.data?.currency).toBe("usd");
    expect(result.data).not.toHaveProperty("amount");
  });

  it("requires one hour of lead time for transfer bookings", () => {
    const now = new Date("2026-07-27T10:00:00Z");
    const transfer = { ...valid, type: "transfer", date: "2026-07-27" };
    expect(validateBookingInput({ ...transfer, time: "13:30" }, now).error).toMatch(/at least 1 hour/i);
    expect(validateBookingInput({ ...transfer, time: "14:01" }, now).data?.time).toBe("14:01");
  });

  it("requires a valid diving-license confirmation for diving bookings", () => {
    const diving = { ...valid, tourSlug: "full-day-diving", tourName: "Full Day Scuba Diving Trip" };
    expect(validateBookingInput(diving).error).toMatch(/valid diving license/i);
    expect(validateBookingInput({ ...diving, divingLicenseConfirmed: true }).data?.divingLicenseConfirmed).toBe(true);
  });

  it("requires every quad-tour participant to be at least 9", () => {
    const quad = { ...valid, tourSlug: "quad-safari-morning", tourName: "Morning Quad Bike Safari" };
    expect(validateBookingInput(quad).error).toMatch(/at least 9/i);
    expect(validateBookingInput({ ...quad, quadMinimumAgeConfirmed: true }).data?.quadMinimumAgeConfirmed).toBe(true);
  });

  it("requires Orange Bay bookings to be at least one day in advance", () => {
    const now = new Date("2026-08-03T08:00:00Z");
    const orangeBay = { ...valid, tourSlug: "orange-bay" };
    expect(validateBookingInput({ ...orangeBay, date: "2026-08-03" }, now).error).toMatch(/at least one day/i);
    expect(validateBookingInput({ ...orangeBay, date: "2026-08-04" }, now).data?.date).toBe("2026-08-04");
  });

  it("enforces the 3 PM cutoff for next-day half-day speedboats", () => {
    const speedboat = { ...valid, tourSlug: "orange-bay-half-day-speedboat" };
    expect(validateBookingInput({ ...speedboat, date: "2026-08-09" }, new Date("2026-08-08T12:30:00Z")).error).toMatch(/two days/i);
    expect(validateBookingInput({ ...speedboat, date: "2026-08-10" }, new Date("2026-08-08T12:30:00Z")).data?.date).toBe("2026-08-10");
    expect(validateBookingInput({ ...speedboat, date: "2026-08-09" }, new Date("2026-08-08T11:30:00Z")).data?.date).toBe("2026-08-09");
  });

  it("accepts Marsa Alam bookings after validating their schedule and cutoff", () => {
    const marsaAlam = {
      ...valid,
      tourSlug: "marsa-mubarak-snorkeling",
      tourName: "Marsa Mubarak Full-Day Snorkeling Boat Trip from Marsa Alam",
      date: "2026-08-18",
      adults: 1,
      youth: 1,
      infants: 0,
    };
    const result = validateBookingInput(marsaAlam, new Date("2026-08-16T12:00:00Z"));
    expect(result.error).toBeUndefined();
    expect(result.data).toMatchObject({ tourSlug: "marsa-mubarak-snorkeling", youth: 1 });
  });

  it("validates safety confirmations for trips in a cart", () => {
    const cart = {
      ...valid,
      tourSlug: "multi-trip",
      tourName: "Multi-trip booking",
      cartItems: [
        { tourSlug: "orange-bay", date: "2099-01-01", time: "08:00", adults: 1, youth: 0, infants: 0 },
        { tourSlug: "full-day-diving", date: "2099-01-02", time: "08:00", adults: 1, youth: 0, infants: 0 },
      ],
    };
    expect(validateBookingInput(cart).error).toMatch(/diving license/i);
    const confirmed = { ...cart, cartItems: cart.cartItems.map((item) => ({ ...item, divingLicenseConfirmed: item.tourSlug === "full-day-diving" })) };
    expect(validateBookingInput(confirmed).data?.cartItems).toHaveLength(2);
  });
});
