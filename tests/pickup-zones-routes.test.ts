import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type Result = { data: unknown; error: { code?: string; message: string } | null };
const mocks = vi.hoisted(() => ({
  permission: vi.fn(),
  origin: vi.fn(),
  rpc: vi.fn(),
  results: {} as Record<string, Result>,
  writes: [] as Array<{ table: string; op: string; value?: unknown }>,
}));

vi.mock("@/lib/admin-permission", () => ({ hasLivePermission: mocks.permission }));
vi.mock("@/lib/request-origin", () => ({ hasValidRequestOrigin: mocks.origin }));
vi.mock("@/lib/admin-auth", () => ({ isAuthorizedAdmin: (user: unknown) => Boolean(user) }));
vi.mock("@/utils/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u", email: "ops@example.com" } } }) },
    rpc: mocks.rpc,
    from: (table: string) => {
      let op = "select";
      const result = () => mocks.results[`${table}:${op}`] ?? mocks.results[table] ?? { data: [], error: null };
      const chain: Record<string, unknown> = {};
      for (const method of ["select", "eq", "neq", "is", "not", "gte", "in", "order", "limit"]) chain[method] = () => chain;
      for (const method of ["insert", "update", "upsert", "delete"]) chain[method] = (value?: unknown) => { op = method; mocks.writes.push({ table, op: method, value }); return chain; };
      chain.single = async () => result();
      chain.maybeSingle = async () => result();
      chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result()).then(resolve);
      return chain;
    },
  }),
}));

const { GET } = await import("@/app/api/admin/pickup-zones/route");
const { POST: createHotel } = await import("@/app/api/admin/pickup-zones/hotels/route");
const { PUT: putTime } = await import("@/app/api/admin/pickup-zones/times/route");

const ZONE = "10000000-0000-4000-8000-000000000001";
const request = (url: string, method = "GET", body?: unknown) => new NextRequest(`https://dailyredsea.com${url}`, { method, headers: { "Content-Type": "application/json", origin: "https://dailyredsea.com" }, body: body === undefined ? undefined : JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  mocks.results = {};
  mocks.writes = [];
  mocks.permission.mockResolvedValue(true);
  mocks.origin.mockReturnValue(true);
  mocks.rpc.mockResolvedValue({ error: null });
});

describe("pickup zones admin API", () => {
  it("reports the migration when the tables are missing", async () => {
    mocks.results.hotels = { data: null, error: { code: "PGRST205", message: "Could not find the table" } };
    const response = await GET(request("/api/admin/pickup-zones"));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ configured: false, migration: "20261001100000_pickup_zones.sql" });
  });

  it("lists unmatched booking hotels", async () => {
    mocks.results.hotels = { data: [{ id: "h1", name: "Steigenberger Aqua Magic", normalized_name: "steigenberger aqua magic", aliases: [], zone_id: null, active: true }], error: null };
    mocks.results.bookings = { data: [{ hotel: "steigenberger aqua magic hotel", date: "2026-10-02" }, { hotel: "Jaz Aquamarine", date: "2026-10-03" }], error: null };
    const body = await (await GET(request("/api/admin/pickup-zones"))).json();
    expect(body.configured).toBe(true);
    expect(body.unmatched.map((row: { text: string }) => row.text)).toEqual(["Jaz Aquamarine"]);
    expect(body.tours.some((tour: { slug: string }) => tour.slug === "orange-bay")).toBe(true);
  });

  it("requires the operations permission", async () => {
    mocks.permission.mockResolvedValue(false);
    expect((await GET(request("/api/admin/pickup-zones"))).status).toBe(403);
    expect((await createHotel(request("/api/admin/pickup-zones/hotels", "POST", { name: "X" }))).status).toBe(403);
  });

  it("blocks writes from other origins and in previews", async () => {
    mocks.origin.mockReturnValue(false);
    expect((await createHotel(request("/api/admin/pickup-zones/hotels", "POST", { name: "X" }))).status).toBe(403);
    mocks.origin.mockReturnValue(true);
    vi.stubEnv("VERCEL_ENV", "preview");
    expect((await createHotel(request("/api/admin/pickup-zones/hotels", "POST", { name: "X" }))).status).toBe(503);
    expect(mocks.writes).toEqual([]);
  });

  it("adds a hotel with its normalized name and audits it", async () => {
    mocks.results["hotels:insert"] = { data: { id: "h9", name: "Jaz Aquamarine Resort", normalized_name: "jaz aquamarine" }, error: null };
    const response = await createHotel(request("/api/admin/pickup-zones/hotels", "POST", { name: "Jaz Aquamarine Resort", zone_id: ZONE }));
    expect(response.status).toBe(201);
    expect(mocks.writes[0]).toEqual({ table: "hotels", op: "insert", value: { name: "Jaz Aquamarine Resort", normalized_name: "jaz aquamarine", aliases: [], zone_id: ZONE, active: true } });
    expect(mocks.rpc).toHaveBeenCalledWith("record_admin_audit", expect.objectContaining({ action_name: "create", resource_name: "hotels", resource_identifier: "h9" }));
  });

  it("refuses a hotel whose name already matches another hotel", async () => {
    mocks.results.hotels = { data: [{ id: "h1", name: "Steigenberger Aqua Magic", normalized_name: "steigenberger aqua magic", aliases: ["Aqua Magic"], zone_id: null, active: true }], error: null };
    const response = await createHotel(request("/api/admin/pickup-zones/hotels", "POST", { name: "Aqua Magic Hotel" }));
    expect(response.status).toBe(409);
    expect(mocks.writes).toEqual([]);
  });

  it("sets and clears a zone pickup time", async () => {
    mocks.results["zone_pickup_times:upsert"] = { data: { zone_id: ZONE, tour_slug: "orange-bay", pickup_time: "07:30:00" }, error: null };
    const set = await putTime(request("/api/admin/pickup-zones/times", "PUT", { zone_id: ZONE, tour_slug: "orange-bay", pickup_time: "07:30" }));
    expect(set.status).toBe(200);
    expect(mocks.writes[0]).toMatchObject({ table: "zone_pickup_times", op: "upsert", value: { zone_id: ZONE, tour_slug: "orange-bay", pickup_time: "07:30" } });

    mocks.writes = [];
    mocks.results["zone_pickup_times:select"] = { data: { zone_id: ZONE, tour_slug: "orange-bay", pickup_time: "07:30:00" }, error: null };
    const cleared = await putTime(request("/api/admin/pickup-zones/times", "PUT", { zone_id: ZONE, tour_slug: "orange-bay", pickup_time: "" }));
    expect(await cleared.json()).toEqual({ record: null });
    expect(mocks.writes).toEqual([{ table: "zone_pickup_times", op: "delete", value: undefined }]);
  });

  it("rejects unknown tours and bad times", async () => {
    expect((await putTime(request("/api/admin/pickup-zones/times", "PUT", { zone_id: ZONE, tour_slug: "nope", pickup_time: "07:30" }))).status).toBe(400);
    expect((await putTime(request("/api/admin/pickup-zones/times", "PUT", { zone_id: ZONE, tour_slug: "orange-bay", pickup_time: "7am" }))).status).toBe(400);
  });
});
