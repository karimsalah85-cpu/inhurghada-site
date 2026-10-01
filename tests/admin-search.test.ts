import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { bookingSearchHref, containsPattern, normalizeSearchQuery, phoneDigitsPattern, rankSearchResults } from "@/lib/admin-search";

describe("admin search query sanitizing", () => {
  it("requires 3 characters after trimming", () => {
    expect(normalizeSearchQuery("  ab ")).toBeNull();
    expect(normalizeSearchQuery(null)).toBeNull();
    expect(normalizeSearchQuery(" drs ")).toBe("drs");
  });

  it("strips PostgREST filter syntax and control characters", () => {
    expect(normalizeSearchQuery("a,b(c)d\"e\\f*g")).toBe("a b c d e f g");
    expect(normalizeSearchQuery("x),status.eq.paid")).toBe("x status.eq.paid");
    expect(normalizeSearchQuery("ab\u0000\ncd")).toBe("ab cd");
  });

  it("caps the length", () => {
    expect(normalizeSearchQuery("a".repeat(200))).toHaveLength(80);
  });

  it("escapes LIKE wildcards so they match literally", () => {
    expect(containsPattern("DRS")).toBe("%DRS%");
    expect(containsPattern("100%_off")).toBe("%100\\%\\_off%");
    expect(containsPattern("a\\b")).toBe("%a\\\\b%");
  });

  it("matches phone digits regardless of formatting", () => {
    expect(phoneDigitsPattern("DRS")).toBeNull();
    expect(phoneDigitsPattern("12")).toBeNull();
    const pattern = phoneDigitsPattern("+20 100-123")!;
    expect(pattern).toBe("2[^0-9]*0[^0-9]*1[^0-9]*0[^0-9]*0[^0-9]*1[^0-9]*2[^0-9]*3");
    expect(new RegExp(pattern).test("+20 100 123 4567")).toBe(true);
    expect(new RegExp(pattern).test("+20 100 124 4567")).toBe(false);
  });

  it("links to the booking's month filtered by reference", () => {
    expect(bookingSearchHref("DRS-1", "2026-10-05")).toBe("/admin/bookings?month=2026-10&search=DRS-1");
    expect(bookingSearchHref("DRS-1", null)).toBe("/admin/bookings?search=DRS-1");
    expect(bookingSearchHref("DRS-1", "2026-10-05", true)).toBe("/admin/bookings?month=2026-10&search=DRS-1&archive=all");
  });

  it("de-duplicates and ranks non-archived first, then newest date", () => {
    const row = (id: string, date: string | null, archived_at: string | null = null) => ({ id, reference: `DRS-${id}`, customer_name: "Guest", tour_name: null, date, status: "new", archived_at });
    const ranked = rankSearchResults([row("a", "2026-01-01"), row("b", "2026-12-01", "2026-12-02"), row("c", "2026-06-01"), row("a", "2026-01-01"), row("d", null)]);
    expect(ranked.map((result) => result.id)).toEqual(["c", "a", "d", "b"]);
    expect(ranked[0].tour_name).toBe("Transfer");
    expect(ranked[3].archived).toBe(true);
    expect(rankSearchResults(Array.from({ length: 20 }, (_, index) => row(String(index), "2026-01-01")))).toHaveLength(8);
  });
});

const mocks = vi.hoisted(() => ({
  user: { id: "admin-id" } as { id: string } | null,
  permission: vi.fn(),
  from: vi.fn(),
  rateLimit: vi.fn(),
}));
vi.mock("@/lib/admin-permission", () => ({ hasLivePermission: mocks.permission }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));
vi.mock("@/utils/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: mocks.user } }) }, from: mocks.from }) }));
import { GET } from "@/app/api/admin/search/route";

type Call = { method: string; args: unknown[] };
function bookingsQuery(data: unknown[], calls: Call[][]) {
  const log: Call[] = [];
  calls.push(log);
  const query: Record<string, unknown> = {};
  for (const method of ["select", "order", "limit", "ilike", "filter"]) query[method] = vi.fn((...args: unknown[]) => { log.push({ method, args }); return query; });
  query.then = (resolve: (value: unknown) => void) => resolve({ data, error: null });
  return query;
}
const search = (q: string) => GET(new NextRequest(`https://dailyredsea.com/api/admin/search?q=${encodeURIComponent(q)}`));

describe("GET /api/admin/search", () => {
  let calls: Call[][];
  beforeEach(() => {
    vi.clearAllMocks();
    calls = [];
    mocks.user = { id: "admin-id" };
    mocks.permission.mockImplementation(async (_client, _user, permission) => permission === "bookings");
    mocks.rateLimit.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.from.mockImplementation(() => bookingsQuery([{ id: "b1", reference: "DRS-1", customer_name: "Ana", tour_name: "Boat", date: "2026-10-01", status: "new", archived_at: null }], calls));
  });

  it("rejects signed-out requests without touching bookings", async () => {
    mocks.user = null;
    const response = await search("DRS");
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ results: [] });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("rejects admins with neither bookings nor reports permission", async () => {
    mocks.permission.mockResolvedValue(false);
    expect((await search("DRS")).status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("allows reports-only staff", async () => {
    mocks.permission.mockImplementation(async (_client, _user, permission) => permission === "reports");
    const response = await search("DRS");
    expect(response.status).toBe(200);
    expect((await response.json()).results[0]).toMatchObject({ reference: "DRS-1", href: "/admin/bookings?month=2026-10&search=DRS-1" });
  });

  it("returns nothing for short queries without querying", async () => {
    const response = await search("ab");
    expect(await response.json()).toEqual({ results: [] });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("queries each column separately with escaped patterns and a digits regex for phones", async () => {
    await search("50%,0100)");
    const filters = calls.map((log) => log.filter((call) => call.method === "ilike" || call.method === "filter").map((call) => call.args));
    expect(filters).toEqual([
      [["reference", "%50\\% 0100%"]],
      [["customer_name", "%50\\% 0100%"]],
      [["customer_email", "%50\\% 0100%"]],
      [["phone", "imatch", "5[^0-9]*0[^0-9]*0[^0-9]*1[^0-9]*0[^0-9]*0"]],
    ]);
  });

  it("merges duplicate matches into one result", async () => {
    const body = await (await search("DRS-1")).json();
    expect(body.results).toHaveLength(1);
  });

  it("rate-limits per user", async () => {
    mocks.rateLimit.mockReturnValue({ allowed: false, retryAfterSeconds: 30 });
    const response = await search("DRS");
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
    expect(mocks.rateLimit).toHaveBeenCalledWith("admin-search:admin-id", expect.any(Number), expect.any(Number));
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
