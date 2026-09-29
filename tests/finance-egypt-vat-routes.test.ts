import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  user: { id: "admin-id", email: "accountant@example.com" } as { id: string; email: string } | null,
  permission: vi.fn(), origin: vi.fn(), rpc: vi.fn(), rows: vi.fn(),
}));
vi.mock("@/lib/admin-permission", () => ({ hasLivePermission: mocks.permission }));
vi.mock("@/lib/request-origin", () => ({ hasValidRequestOrigin: mocks.origin }));
vi.mock("@/utils/supabase/server", () => ({
  createClient: async () => {
    const query = { select: () => query, order: () => query, limit: async () => ({ data: mocks.rows(), error: null }) };
    return { auth: { getUser: async () => ({ data: { user: mocks.user } }) }, rpc: mocks.rpc, from: () => query };
  },
}));

import { POST as setVatStatus } from "@/app/api/admin/finance/suppliers/[id]/vat/route";
import { GET as paymentsToRecord } from "@/app/api/admin/finance/payments-to-record/route";

const id = "30000000-0000-4000-8000-000000000003";
const post = (body: unknown) =>
  new NextRequest("https://dailyredsea.com/api/admin/finance/x", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const params = (value = id) => ({ params: Promise.resolve({ id: value }) });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: "admin-id", email: "accountant@example.com" };
  mocks.origin.mockReturnValue(true);
  mocks.permission.mockImplementation(async (_client, _user, permission) => permission === "view_finance" || permission === "manage_finance");
  mocks.rpc.mockResolvedValue({ data: { vat_status: "on_top", trips_updated: 2 }, error: null });
  mocks.rows.mockReturnValue([{ booking_id: id, reason: "marked_paid" }]);
});

describe("partner VAT status route", () => {
  it("sets the status, optionally from a date", async () => {
    const response = await setVatStatus(post({ vat_status: "on_top", apply_from: "2026-10-01" }), params());
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("finance_set_partner_vat_status", { p_supplier_id: id, p_status: "on_top", p_apply_from: "2026-10-01" });
    await setVatStatus(post({ vat_status: "not_registered", apply_from: "" }), params());
    expect(mocks.rpc).toHaveBeenLastCalledWith("finance_set_partner_vat_status", { p_supplier_id: id, p_status: "not_registered", p_apply_from: null });
  });

  it("rejects unknown statuses, bad ids and staff who cannot manage finance", async () => {
    expect((await setVatStatus(post({ vat_status: "exempt" }), params())).status).toBe(400);
    expect((await setVatStatus(post({ vat_status: "included" }), params("nope"))).status).toBe(400);
    mocks.permission.mockImplementation(async (_client, _user, permission) => permission === "view_finance");
    expect((await setVatStatus(post({ vat_status: "included" }), params())).status).toBe(403);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

describe("payments to record route", () => {
  it("lists the queue for finance staff only", async () => {
    const response = await paymentsToRecord();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ rows: [{ booking_id: id, reason: "marked_paid" }], canManage: true });
    mocks.permission.mockResolvedValue(false);
    expect((await paymentsToRecord()).status).toBe(403);
    mocks.user = null;
    expect((await paymentsToRecord()).status).toBe(401);
  });
});
