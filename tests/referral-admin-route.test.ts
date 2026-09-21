import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  user: { id: "admin-id" } as { id: string } | null,
  permission: vi.fn(), origin: vi.fn(), admin: vi.fn(), from: vi.fn(), rpc: vi.fn(),
}));
vi.mock("@/lib/admin-permission", () => ({ hasLivePermission: mocks.permission }));
vi.mock("@/lib/request-origin", () => ({ hasValidRequestOrigin: mocks.origin }));
vi.mock("@/utils/supabase/admin", () => ({ createRequiredAdminClient: mocks.admin }));
vi.mock("@/utils/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: mocks.user } }) }, from: mocks.from, rpc: mocks.rpc }) }));
import { GET, POST } from "@/app/api/admin/referrals/route";
const id = "10000000-0000-4000-8000-000000000001";
function post(body: unknown) { return new NextRequest("https://dailyredsea.com/api/admin/referrals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); }
function bookingQuery(data: unknown) { const query = { select: vi.fn(() => query), eq: vi.fn(() => query), single: vi.fn(async () => ({ data })) }; return query; }

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: "admin-id" };
  mocks.origin.mockReturnValue(true);
  mocks.permission.mockImplementation(async (_client, _user, permission) => permission === "bookings");
  mocks.from.mockReturnValue(bookingQuery({ id, referral_exclusion_reason: null }));
});
describe("admin referral authorization", () => {
  it("does not initialize service credentials for unauthenticated requests", async () => {
    mocks.user = null;
    expect((await GET(new NextRequest(`https://dailyredsea.com/api/admin/referrals?bookingId=${id}`))).status).toBe(403);
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("requires a current booking permission before privileged reads", async () => {
    mocks.permission.mockResolvedValue(false);
    expect((await GET(new NextRequest(`https://dailyredsea.com/api/admin/referrals?bookingId=${id}`))).status).toBe(403);
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("rejects cross-origin mutations before reading booking data", async () => {
    mocks.origin.mockReturnValue(false);
    expect((await POST(post({ bookingId: id, action: "exclude", reason: "fraud" }))).status).toBe(403);
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("does not let bookings-only staff approve rewards", async () => {
    expect((await POST(post({ bookingId: id, action: "review", decision: "approve", reason: "Verified separate parties" }))).status).toBe(403);
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("checks booking visibility through the signed-in client before privileged reads", async () => {
    mocks.from.mockReturnValue(bookingQuery(null));
    expect((await GET(new NextRequest(`https://dailyredsea.com/api/admin/referrals?bookingId=${id}`))).status).toBe(404);
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("rejects arbitrary exclusion reasons and malformed participant contacts", async () => {
    expect((await POST(post({ bookingId: id, action: "exclude", reason: "unrelated_same_tour" }))).status).toBe(400);
    expect((await POST(post({ bookingId: id, action: "participant", email: "invalid", phone: "123" }))).status).toBe(400);
    expect(mocks.admin).not.toHaveBeenCalled();
  });
});
