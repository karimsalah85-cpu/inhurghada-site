import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// A small in-memory stand-in for the Supabase query builder: enough filters for these routes.
type Row = Record<string, unknown>;
const db = vi.hoisted(() => ({ tables: {} as Record<string, Record<string, unknown>[]>, deleteError: null as { code: string; message: string } | null, writes: [] as Array<{ table: string; op: string; value: unknown }> }));

vi.mock("@/lib/admin-permission", () => ({ hasLivePermission: async () => true }));
vi.mock("@/lib/admin-auth", () => ({ isAuthorizedAdmin: () => true }));
vi.mock("@/lib/request-origin", () => ({ hasValidRequestOrigin: () => true }));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
vi.mock("@/utils/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u1", email: "ops@example.com" } } }) },
    rpc: async () => ({ data: null, error: null }),
    from: (table: string) => {
      const filters: Array<(row: Row) => boolean> = [];
      let op: "select" | "insert" | "update" | "delete" = "select";
      let payload: Row = {};
      const rows = () => (db.tables[table] || []).filter((row) => filters.every((test) => test(row)));
      const run = () => {
        if (op === "insert") {
          const duplicate = table === "tour_availability" && (db.tables[table] || []).some((row) => row.tour_slug === payload.tour_slug && row.service_date === payload.service_date && row.start_time === payload.start_time);
          if (duplicate) return { data: null, error: { code: "23505", message: "duplicate key value" } };
          const created = { id: `new-${(db.tables[table] || []).length + 1}`, ...payload };
          db.tables[table] = [...(db.tables[table] || []), created];
          db.writes.push({ table, op, value: created });
          return { data: [created], error: null };
        }
        if (op === "update") {
          const matched = rows();
          for (const row of matched) Object.assign(row, payload);
          db.writes.push({ table, op, value: payload });
          return { data: matched, error: null };
        }
        if (op === "delete") {
          if (db.deleteError) return { data: null, error: db.deleteError };
          const gone = new Set(rows());
          db.tables[table] = (db.tables[table] || []).filter((row) => !gone.has(row));
          db.writes.push({ table, op, value: [...gone] });
          return { data: [...gone], error: null };
        }
        return { data: rows(), error: null };
      };
      const chain = {
        select: () => chain,
        insert: (value: Row) => { op = "insert"; payload = value; return chain; },
        update: (value: Row) => { op = "update"; payload = value; return chain; },
        delete: () => { op = "delete"; return chain; },
        eq: (field: string, value: unknown) => { filters.push((row) => row[field] === value); return chain; },
        neq: (field: string, value: unknown) => { filters.push((row) => row[field] !== value); return chain; },
        gte: (field: string, value: string) => { filters.push((row) => String(row[field]) >= value); return chain; },
        lte: (field: string, value: string) => { filters.push((row) => String(row[field]) <= value); return chain; },
        order: () => chain,
        limit: () => chain,
        range: () => chain,
        single: async () => { const result = run(); const first = (result.data || [])[0]; return result.error ? result : first ? { data: first, error: null } : { data: null, error: { code: "PGRST116", message: "no rows" } }; },
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(run()).then(resolve),
      };
      return chain;
    },
  }),
}));

import { POST } from "@/app/api/admin/control-center/route";
import { DELETE, PATCH } from "@/app/api/admin/control-center/[resource]/[id]/route";
import { tours } from "@/data/tours";
import { supportsDatePrice } from "@/lib/date-pricing";

const single = tours.find((tour) => tour.category !== "Airport Transfer" && supportsDatePrice(tour))!;
const slug = single.slug;
const tourCurrency = single.currency || "USD";
const boatSlug = tours.find((tour) => tour.boatOptions?.length)!.slug;
const request = (method: string, body?: unknown) => new NextRequest("https://dailyredsea.com/api/admin/control-center", { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
const create = (body: Row) => POST(request("POST", { resource: "availability", ...body }));
const context = (id: string) => ({ params: Promise.resolve({ resource: "availability", id }) });
const patch = (id: string, body: Row) => PATCH(request("PATCH", body), context(id));
const availability = () => db.tables.tour_availability;

beforeEach(() => {
  // Vercel preview builds run these tests with VERCEL_ENV=preview, where writes are blocked on purpose.
  vi.stubEnv("VERCEL_ENV", "production");
  db.deleteError = null;
  db.writes = [];
  db.tables = {
    content_items: [],
    bookings: [
      { id: "b1", tour_slug: slug, date: "2026-12-24", guests: 5, start_time: null, status: "confirmed" },
      { id: "b2", tour_slug: slug, date: "2026-12-24", guests: 3, start_time: "09:00:00", status: "pending" },
      { id: "b3", tour_slug: slug, date: "2026-12-24", guests: 9, start_time: null, status: "cancelled" },
      { id: "b4", tour_slug: slug, date: "2026-12-25", guests: 2, start_time: null, status: "confirmed" },
    ],
    tour_availability: [
      { id: "a1", tour_slug: slug, service_date: "2026-12-20", start_time: null, capacity: 40, reserved: 6, blocked: false, price_override: null, currency: "USD", notes: null },
      { id: "a2", tour_slug: slug, service_date: "2026-12-21", start_time: "09:00:00", capacity: 10, reserved: 0, blocked: false, price_override: null, currency: "USD", notes: null },
    ],
  };
});

describe("creating an availability record", () => {
  it("starts from the places already booked that day, ignoring cancelled bookings", async () => {
    const response = await create({ tour_slug: slug, service_date: "2026-12-24", start_time: "", capacity: "10", blocked: false, price_override: "", notes: "" });
    expect(response.status).toBe(201);
    expect((await response.json()).record).toMatchObject({ tour_slug: slug, service_date: "2026-12-24", start_time: null, capacity: 10, reserved: 8, blocked: false, price_override: null, currency: tourCurrency, notes: null });
  });

  it("saves a date price in the trip's own currency, whatever the form sends", async () => {
    const response = await create({ tour_slug: slug, service_date: "2026-12-26", price_override: "49.5", currency: "GBP" });
    expect(response.status).toBe(201);
    expect((await response.json()).record).toMatchObject({ price_override: 49.5, currency: tourCurrency });
  });

  it("refuses a date price on trips priced by boat, package or group size", async () => {
    const response = await create({ tour_slug: boatSlug, service_date: "2026-12-26", price_override: "200" });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/priced by boat, package or group size/);
    expect((await create({ tour_slug: boatSlug, service_date: "2026-12-26", capacity: "1" })).status).toBe(201);
    const edited = await patch("a1", { tour_slug: boatSlug, price_override: "200" });
    expect(edited.status).toBe(400);
  });

  it("a timed record counts that departure plus bookings with no time", async () => {
    const nine = await (await create({ tour_slug: slug, service_date: "2026-12-24", start_time: "09:00", capacity: 10 })).json();
    expect(nine.record).toMatchObject({ start_time: "09:00:00", reserved: 8 });
    db.tables.tour_availability = [];
    const two = await (await create({ tour_slug: slug, service_date: "2026-12-24", start_time: "14:00", capacity: 10 })).json();
    expect(two.record).toMatchObject({ start_time: "14:00:00", reserved: 5 });
  });

  it("rejects bad values before they reach the database", async () => {
    for (const bad of [{ capacity: "-3" }, { capacity: "2.5" }, { price_override: "-1" }, { service_date: "2026-13-01" }, { tour_slug: "not-a-real-tour" }, { start_time: "25:99" }]) {
      const response = await create({ tour_slug: slug, service_date: "2026-12-26", ...bad });
      expect(response.status, JSON.stringify(bad)).toBe(400);
    }
    expect(db.writes).toHaveLength(0);
  });

  it("explains a duplicate instead of showing a database error", async () => {
    const response = await create({ tour_slug: slug, service_date: "2026-12-20", capacity: "5" });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/already has a record for that date/);
  });
});

describe("editing an availability record", () => {
  it("clearing seats, time and price saves nulls (the form sends empty strings)", async () => {
    const response = await patch("a2", { tour_slug: slug, service_date: "2026-12-21", start_time: "", capacity: "", blocked: false, price_override: "", notes: "", reserved: 99, id: "hack" });
    expect(response.status).toBe(200);
    expect(availability().find((row) => row.id === "a2")).toMatchObject({ start_time: null, capacity: null, price_override: null, notes: null, reserved: 0 });
  });

  it("keeps tour, date and time fixed once places are booked", async () => {
    const moved = await patch("a1", { service_date: "2026-12-27" });
    expect(moved.status).toBe(409);
    expect((await moved.json()).error).toMatch(/6 place\(s\) are already booked/);
    expect(availability().find((row) => row.id === "a1")).toMatchObject({ service_date: "2026-12-20" });
    // Seats and closures still change, also when the unchanged slot is sent along.
    const seats = await patch("a1", { tour_slug: slug, service_date: "2026-12-20", start_time: "", capacity: "4", blocked: true });
    expect(seats.status).toBe(200);
    expect(availability().find((row) => row.id === "a1")).toMatchObject({ capacity: 4, blocked: true, reserved: 6 });
  });

  it("lets an unbooked record move, and rejects bad values", async () => {
    expect((await patch("a2", { service_date: "2026-12-22" })).status).toBe(200);
    expect((await patch("a2", { capacity: "many" })).status).toBe(400);
    expect((await patch("a2", { tour_slug: "not-a-real-tour" })).status).toBe(400);
  });
});

describe("deleting an availability record", () => {
  it("removes it", async () => {
    const response = await DELETE(request("DELETE"), context("a2"));
    expect(await response.json()).toEqual({ deleted: true });
    expect(availability().map((row) => row.id)).toEqual(["a1"]);
  });

  it("explains why a record held by multi-trip bookings cannot go", async () => {
    db.deleteError = { code: "23503", message: "violates foreign key constraint" };
    const response = await DELETE(request("DELETE"), context("a1"));
    expect(response.status).toBe(409);
    expect((await response.json()).error).toMatch(/Multi-trip bookings hold places/);
  });
});

describe("on a preview deployment", () => {
  it("refuses to create, edit or delete availability", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect((await create({ tour_slug: slug, service_date: "2026-12-26", capacity: "5" })).status).toBe(503);
    expect((await patch("a2", { capacity: "5" })).status).toBe(503);
    expect((await DELETE(request("DELETE"), context("a2"))).status).toBe(503);
    expect(db.writes).toHaveLength(0);
    expect(availability()).toHaveLength(2);
  });
});
