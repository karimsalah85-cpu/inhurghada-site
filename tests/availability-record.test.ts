import { describe, expect, it } from "vitest";
import { availabilityState, isIsoDate, movesReservedPlaces, normalizeStartTime, validateAvailabilityRecord } from "@/lib/availability-record";

const known = new Set(["orange-bay", "giftun"]);
const base = { tour_slug: "orange-bay", service_date: "2026-12-24", start_time: "", capacity: "", blocked: false, price_override: "", currency: "USD", notes: "" };

describe("availability record validation", () => {
  it("turns the empty form fields into nulls instead of passing empty strings to the database", () => {
    const result = validateAvailabilityRecord(base, { knownSlugs: known });
    expect(result).toEqual({ ok: true, value: { tour_slug: "orange-bay", service_date: "2026-12-24", start_time: null, capacity: null, blocked: false, price_override: null, currency: "USD", notes: null } });
  });

  it("clearing seats, time or price on an edit saves null", () => {
    const result = validateAvailabilityRecord({ capacity: "", start_time: "", price_override: "" }, { partial: true });
    expect(result).toEqual({ ok: true, value: { capacity: null, start_time: null, price_override: null } });
  });

  it("only touches the fields an edit sends", () => {
    expect(validateAvailabilityRecord({ blocked: true }, { partial: true })).toEqual({ ok: true, value: { blocked: true } });
  });

  it("rejects values the database would refuse, with a readable message", () => {
    for (const bad of [{ capacity: -1 }, { capacity: 2.5 }, { capacity: "abc" }, { capacity: 10_001 }, { price_override: -5 }, { price_override: "x" }, { start_time: "25:00" }, { start_time: "noon" }, { service_date: "2026-02-31" }, { service_date: "24/12/2026" }, { tour_slug: "" }, { currency: "dollars" }]) {
      const result = validateAvailabilityRecord({ ...base, ...bad }, { knownSlugs: known });
      expect(result.ok, JSON.stringify(bad)).toBe(false);
    }
  });

  it("refuses a tour that is not in the catalog", () => {
    expect(validateAvailabilityRecord({ ...base, tour_slug: "made-up-tour" }, { knownSlugs: known })).toMatchObject({ ok: false, error: expect.stringContaining("not in the catalog") });
  });

  it("normalises times and prices", () => {
    expect(normalizeStartTime("9:30")).toEqual({ ok: true, value: "09:30:00" });
    expect(normalizeStartTime("14:05:00")).toEqual({ ok: true, value: "14:05:00" });
    const result = validateAvailabilityRecord({ ...base, capacity: "40", price_override: "29.999", currency: "eur", notes: "  Peak week  " }, { knownSlugs: known });
    expect(result.ok && result.value).toMatchObject({ capacity: 40, price_override: 30, currency: "EUR", notes: "Peak week" });
  });

  it("checks real calendar dates", () => {
    expect(isIsoDate("2028-02-29")).toBe(true);
    expect(isIsoDate("2027-02-29")).toBe(false);
  });
});

describe("availability state", () => {
  it("describes a date the way the booking engine treats it", () => {
    expect(availabilityState({ blocked: true, capacity: 40, reserved: 0 })).toBe("closed");
    expect(availabilityState({ blocked: false, capacity: null, reserved: 500 })).toBe("open");
    expect(availabilityState({ blocked: false, capacity: 40, reserved: 10 })).toBe("open");
    expect(availabilityState({ blocked: false, capacity: 40, reserved: 37 })).toBe("limited");
    expect(availabilityState({ blocked: false, capacity: 40, reserved: 40 })).toBe("full");
    expect(availabilityState({ blocked: false, capacity: 40, reserved: 45 })).toBe("overbooked");
    expect(availabilityState({ blocked: false, capacity: 0, reserved: 0 })).toBe("full");
  });
});

describe("moving a record that has bookings", () => {
  const before = { tour_slug: "orange-bay", service_date: "2026-12-24", start_time: "09:00:00" };
  it("spots a change of tour, date or time", () => {
    expect(movesReservedPlaces(before, { service_date: "2026-12-25" })).toBe(true);
    expect(movesReservedPlaces(before, { tour_slug: "giftun" })).toBe(true);
    expect(movesReservedPlaces(before, { start_time: null })).toBe(true);
    expect(movesReservedPlaces(before, { start_time: "10:00:00" })).toBe(true);
  });
  it("lets seats, closures and notes change, and ignores a resent identical slot", () => {
    expect(movesReservedPlaces(before, { capacity: 20, blocked: true, notes: "Wind" })).toBe(false);
    expect(movesReservedPlaces(before, { tour_slug: "orange-bay", service_date: "2026-12-24", start_time: "09:00:00" })).toBe(false);
    expect(movesReservedPlaces({ ...before, start_time: null }, { start_time: null })).toBe(false);
  });
});
