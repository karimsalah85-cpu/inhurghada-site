import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  user: { id: "admin-id", email: "accountant@example.com" } as { id: string; email: string } | null,
  permission: vi.fn(), origin: vi.fn(), rpc: vi.fn(),
}));
vi.mock("@/lib/admin-permission", () => ({ hasLivePermission: mocks.permission }));
vi.mock("@/lib/request-origin", () => ({ hasValidRequestOrigin: mocks.origin }));
vi.mock("@/utils/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: mocks.user } }) }, rpc: mocks.rpc }) }));

import { POST as addPartner } from "@/app/api/admin/finance/lines/[id]/partners/route";
import { PATCH as updatePartner } from "@/app/api/admin/finance/partner-costs/[id]/route";
import { POST as removePartner } from "@/app/api/admin/finance/partner-costs/[id]/remove/route";

const lineId = "20000000-0000-4000-8000-000000000002";
const supplierId = "10000000-0000-4000-8000-000000000001";
const costId = "30000000-0000-4000-8000-000000000003";
const context = (id: string) => ({ params: Promise.resolve({ id }) });
const request = (method: string, body: unknown) =>
  new NextRequest("https://dailyredsea.com/api/admin/finance/x", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: "admin-id", email: "accountant@example.com" };
  mocks.origin.mockReturnValue(true);
  mocks.permission.mockImplementation(async (_client, _user, permission) => permission === "view_finance" || permission === "manage_finance");
  mocks.rpc.mockResolvedValue({ data: { id: costId }, error: null });
});

describe("extra partner routes", () => {
  it("adds a guide with a normalized cost and fee", async () => {
    const response = await addPartner(request("POST", { supplier_id: supplierId, role: "guide", cost: "500", currency: "EGP", cancellation_fee: "150.5" }), context(lineId));
    expect(response.status).toBe(201);
    expect(mocks.rpc).toHaveBeenCalledWith("finance_add_partner_cost", {
      p_line_id: lineId, p_supplier_id: supplierId, p_role: "guide", p_cost: "500.00", p_currency: "EGP", p_cancellation_fee: "150.50", p_note: null,
    });
  });

  it("sends no cost or currency when the price list should be used", async () => {
    await addPartner(request("POST", { supplier_id: supplierId, role: "driver", cost: "", currency: "" }), context(lineId));
    expect(mocks.rpc).toHaveBeenCalledWith("finance_add_partner_cost", expect.objectContaining({ p_cost: null, p_currency: null, p_cancellation_fee: "0.00" }));
  });

  it.each([
    [{ supplier_id: supplierId, role: "pilot", cost: "5", currency: "EGP" }],
    [{ supplier_id: supplierId, role: "guide", cost: "-5", currency: "EGP" }],
    [{ supplier_id: supplierId, role: "guide", cost: "5" }],
    [{ supplier_id: "nope", role: "guide", cost: "5", currency: "EGP" }],
  ])("validates new partners server-side: %j", async (body) => {
    expect((await addPartner(request("POST", body), context(lineId))).status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("is refused to view-only staff and cross-origin requests", async () => {
    mocks.permission.mockImplementation(async (_c, _u, permission) => permission === "view_finance");
    expect((await addPartner(request("POST", { supplier_id: supplierId, role: "guide", cost: "5", currency: "EGP" }), context(lineId))).status).toBe(403);
    mocks.origin.mockReturnValue(false);
    expect((await removePartner(request("POST", { reason: "Not needed" }), context(costId))).status).toBe(403);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("updates only known fields and requires a reason to remove", async () => {
    expect((await updatePartner(request("PATCH", { cost: "650", currency: "EGP" }), context(costId))).status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("finance_update_partner_cost", { p_id: costId, p_changes: { cost: "650.00", currency: "EGP" } });
    expect((await updatePartner(request("PATCH", { supplier_id: supplierId }), context(costId))).status).toBe(400);
    expect((await removePartner(request("POST", { reason: "" }), context(costId))).status).toBe(400);
    expect((await removePartner(request("POST", { reason: "Guide was sick" }), context(costId))).status).toBe(200);
    expect(mocks.rpc).toHaveBeenLastCalledWith("finance_remove_partner_cost", { p_id: costId, p_reason: "Guide was sick" });
  });

  it("passes the database's partner rules through", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: "22023", message: "Guide Ahmed is already on this trip." } });
    const response = await addPartner(request("POST", { supplier_id: supplierId, role: "guide", cost: "5", currency: "EGP" }), context(lineId));
    expect([response.status, (await response.json()).error]).toEqual([400, "Guide Ahmed is already on this trip."]);
  });
});
