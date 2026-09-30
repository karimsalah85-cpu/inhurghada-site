import { describe, expect, it } from "vitest";
import { bulkDates, planBulkAvailability, validateBulkAvailability } from "@/lib/availability-bulk";

const base = { tourSlugs: ["orange-bay"], from: "2026-10-05", to: "2026-10-11", weekdays: [0, 1, 2, 3, 4, 5, 6], action: "capacity" as const, capacity: 40, note: "" };

describe("bulk availability", () => {
  it("lists only the chosen weekdays", () => {
    // 2026-10-05 is a Monday.
    expect(bulkDates({ from: "2026-10-05", to: "2026-10-11", weekdays: [1, 3] })).toEqual(["2026-10-05", "2026-10-07"]);
  });

  it("rejects bad input with a readable message", () => {
    expect(validateBulkAvailability({ ...base, tourSlugs: [] })).toEqual({ ok: false, error: "Choose at least one tour." });
    expect(validateBulkAvailability({ ...base, to: "2026-10-01" })).toMatchObject({ ok: false });
    expect(validateBulkAvailability({ ...base, from: "2026-01-01", to: "2027-06-01" })).toMatchObject({ ok: false });
    expect(validateBulkAvailability({ ...base, weekdays: [] })).toMatchObject({ ok: false });
    expect(validateBulkAvailability({ ...base, capacity: -2 })).toMatchObject({ ok: false });
    expect(validateBulkAvailability({ ...base, action: "delete" })).toMatchObject({ ok: false });
  });

  it("treats an empty capacity as unlimited", () => {
    const result = validateBulkAvailability({ ...base, capacity: "" });
    expect(result.ok && result.value.capacity).toBeNull();
  });

  it("creates whole-day rows that count bookings already taken", () => {
    const plan = planBulkAvailability({ ...base, to: "2026-10-06" }, [], [
      { tour_slug: "orange-bay", date: "2026-10-05", guests: 6 },
      { tour_slug: "orange-bay", date: "2026-10-05", guests: 3 },
      { tour_slug: "other", date: "2026-10-05", guests: 50 },
    ]);
    expect(plan.inserts).toHaveLength(2);
    expect(plan.inserts[0]).toMatchObject({ tour_slug: "orange-bay", service_date: "2026-10-05", start_time: null, capacity: 40, reserved: 9, blocked: false });
    expect(plan.inserts[1]).toMatchObject({ service_date: "2026-10-06", reserved: 0 });
    expect(plan.updates).toHaveLength(0);
  });

  it("updates existing rows instead of duplicating them and flags overbooked dates", () => {
    const existing = [{ id: "a1", tour_slug: "orange-bay", service_date: "2026-10-05", start_time: "09:00:00", capacity: 60, reserved: 45, blocked: false }];
    const plan = planBulkAvailability({ ...base, to: "2026-10-05" }, existing, []);
    expect(plan.inserts).toHaveLength(0);
    expect(plan.updates).toEqual([{ id: "a1", patch: expect.objectContaining({ capacity: 40, blocked: false }) }]);
    expect(plan.overbooked).toEqual([{ tour_slug: "orange-bay", service_date: "2026-10-05", reserved: 45, capacity: 40 }]);
  });

  it("closes dates for weather with a note, and reopen only touches existing rows", () => {
    const close = planBulkAvailability({ ...base, action: "close", capacity: null, note: "High winds", to: "2026-10-05" }, [], []);
    expect(close.inserts[0]).toMatchObject({ blocked: true, notes: "High winds", capacity: null });
    const reopen = planBulkAvailability({ ...base, action: "reopen", capacity: null, to: "2026-10-06" }, [{ id: "b1", tour_slug: "orange-bay", service_date: "2026-10-06", start_time: null, capacity: null, reserved: 0, blocked: true }], []);
    expect(reopen.inserts).toHaveLength(0);
    expect(reopen.updates).toEqual([{ id: "b1", patch: expect.objectContaining({ blocked: false }) }]);
  });

  it("does not create rows just to say 'unlimited'", () => {
    const plan = planBulkAvailability({ ...base, capacity: null }, [], []);
    expect(plan.inserts).toHaveLength(0);
  });
});
