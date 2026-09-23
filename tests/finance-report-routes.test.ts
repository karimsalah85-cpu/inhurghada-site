import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  user: { id: "admin-id" } as { id: string } | null,
  permission: vi.fn(), origin: vi.fn(), from: vi.fn(), rpc: vi.fn(),
}));
vi.mock("@/lib/admin-permission", () => ({ hasLivePermission: mocks.permission }));
vi.mock("@/lib/request-origin", () => ({ hasValidRequestOrigin: mocks.origin }));
vi.mock("@/utils/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: mocks.user } }) }, from: mocks.from, rpc: mocks.rpc }) }));

import { GET as getPnl } from "@/app/api/admin/finance/pnl/route";
import { GET as getDrill } from "@/app/api/admin/finance/pnl/drilldown/route";
import { GET as getMargins } from "@/app/api/admin/finance/margins/route";
import { PUT as putSettings } from "@/app/api/admin/finance/settings/route";

/** A chainable PostgREST query double that resolves to `result`. */
function query(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq", "is", "gte", "lte", "order", "range", "in", "upsert", "maybeSingle"]) chain[method] = vi.fn(() => chain);
  chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return chain;
}
const get = (url: string) => new NextRequest(`https://dailyredsea.com${url}`);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: "admin-id" };
  mocks.origin.mockReturnValue(true);
  mocks.permission.mockResolvedValue(true);
  mocks.from.mockImplementation(() => query({ data: [], error: null }));
  mocks.rpc.mockResolvedValue({ data: null, error: null });
});

describe("report routes", () => {
  it("require view_finance before any query", async () => {
    mocks.permission.mockResolvedValue(false);
    for (const response of [await getPnl(get("/api/admin/finance/pnl")), await getDrill(get("/api/admin/finance/pnl/drilldown?key=net_sales")), await getMargins(get("/api/admin/finance/margins"))]) {
      expect(response.status).toBe(403);
    }
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it.each([
    "/api/admin/finance/pnl?from=2026-10-10&to=2026-10-01",
    "/api/admin/finance/pnl?from=2026-02-30",
    "/api/admin/finance/pnl?supplier=not-a-uuid",
    "/api/admin/finance/pnl?from=2015-01-01&to=2026-01-01",
  ])("rejects invalid report queries: %s", async (url) => {
    expect((await getPnl(get(url))).status).toBe(400);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("returns an empty but complete report, and a CSV export", async () => {
    const response = await getPnl(get("/api/admin/finance/pnl?from=2026-10-01&to=2026-10-31&compare=1"));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.previous).toEqual({ from: "2026-08-31", to: "2026-09-30" });
    expect(body.gross.find((row: { key: string }) => row.key === "net_profit").current).toBe("0.00");
    expect(body.trend).toHaveLength(1);
    const csv = await getPnl(get("/api/admin/finance/pnl?from=2026-10-01&to=2026-10-31&format=csv"));
    expect(csv.headers.get("content-type")).toContain("text/csv");
    expect(await csv.text()).toContain("Gross view");
  });

  it("reports missing finance tables as not configured", async () => {
    mocks.from.mockImplementation(() => query({ data: null, error: { code: "PGRST205", message: "missing" } }));
    const response = await getPnl(get("/api/admin/finance/pnl"));
    expect(response.status).toBe(503);
    expect((await response.json()).configured).toBe(false);
  });

  it("only drills into known P&L lines", async () => {
    expect((await getDrill(get("/api/admin/finance/pnl/drilldown?key=salaries;drop"))).status).toBe(400);
    expect((await getDrill(get("/api/admin/finance/pnl/drilldown?key=opex:google_ads"))).status).toBe(200);
  });

  it("validates the margin grouping", async () => {
    expect((await getMargins(get("/api/admin/finance/margins?group=customer"))).status).toBe(400);
    const response = await getMargins(get("/api/admin/finance/margins?group=supplier"));
    expect(response.status).toBe(200);
    expect((await response.json()).threshold).toBe("15");
  });
});

describe("margin threshold setting", () => {
  const put = (body: unknown) => new NextRequest("https://dailyredsea.com/api/admin/finance/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  it("requires manage_finance and a same-origin request", async () => {
    mocks.permission.mockImplementation(async (_client, _user, permission) => permission === "view_finance");
    expect((await putSettings(put({ margin_threshold_pct: 20 }))).status).toBe(403);
    mocks.permission.mockResolvedValue(true);
    mocks.origin.mockReturnValue(false);
    expect((await putSettings(put({ margin_threshold_pct: 20 }))).status).toBe(403);
  });

  it.each([[-1], [101], ["abc"], ["12.345"]])("rejects %j", async (value) => {
    expect((await putSettings(put({ margin_threshold_pct: value }))).status).toBe(400);
  });

  it("saves a valid threshold and audits it", async () => {
    const response = await putSettings(put({ margin_threshold_pct: "22.5" }));
    expect(response.status).toBe(200);
    expect(mocks.from).toHaveBeenCalledWith("site_settings");
    expect(mocks.rpc).toHaveBeenCalledWith("record_admin_audit", expect.objectContaining({ resource_identifier: "finance_margin_threshold_pct" }));
  });
});
