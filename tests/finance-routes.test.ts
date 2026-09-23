import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  user: { id: "admin-id", email: "finance@example.com" } as { id: string; email: string } | null,
  permission: vi.fn(), origin: vi.fn(), rpc: vi.fn(), from: vi.fn(),
}));
vi.mock("@/lib/admin-permission", () => ({ hasLivePermission: mocks.permission }));
vi.mock("@/lib/request-origin", () => ({ hasValidRequestOrigin: mocks.origin }));
vi.mock("@/utils/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: mocks.user } }) }, rpc: mocks.rpc, from: mocks.from }) }));

import { POST as postEntry } from "@/app/api/admin/finance/suppliers/[id]/entries/route";
import { POST as postSettlement } from "@/app/api/admin/finance/suppliers/[id]/settlements/route";
import { POST as postReverse } from "@/app/api/admin/finance/ledger/[id]/reverse/route";
import { PATCH as patchLine } from "@/app/api/admin/finance/lines/[id]/route";
import { GET as getSuppliers } from "@/app/api/admin/finance/suppliers/route";
import { GET as getStatement } from "@/app/api/admin/finance/suppliers/[id]/statement/route";

const supplierId = "10000000-0000-4000-8000-000000000001";
const lineId = "20000000-0000-4000-8000-000000000002";
const key = "30000000-0000-4000-8000-000000000003";
const context = (id: string) => ({ params: Promise.resolve({ id }) });
const request = (url: string, method: string, body?: unknown) =>
  new NextRequest(`https://dailyredsea.com${url}`, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: "admin-id", email: "finance@example.com" };
  mocks.origin.mockReturnValue(true);
  mocks.permission.mockImplementation(async (_client, _user, permission) => permission === "view_finance" || permission === "manage_finance");
  mocks.rpc.mockResolvedValue({ data: { id: "entry" }, error: null });
});

describe("finance write routes", () => {
  const payment = { entry_type: "payment_to_supplier", amount: "60", currency: "USD", entry_date: "2026-10-10", line_id: lineId };

  it("records a payment with a normalized amount and the supplier from the URL", async () => {
    const response = await postEntry(request(`/api/admin/finance/suppliers/${supplierId}/entries`, "POST", { ...payment, supplier_id: "someone-else" }), context(supplierId));
    expect(response.status).toBe(201);
    expect(mocks.rpc).toHaveBeenCalledWith("finance_post_supplier_entry", {
      p_supplier_id: supplierId, p_entry_type: "payment_to_supplier", p_amount: "60.00", p_currency: "USD",
      p_entry_date: "2026-10-10", p_line_id: lineId, p_note: null,
    });
  });

  it.each([
    ["signed-out", () => { mocks.user = null; }, 401],
    ["view-only staff", () => { mocks.permission.mockImplementation(async (_c, _u, permission) => permission === "view_finance"); }, 403],
    ["cross-origin", () => { mocks.origin.mockReturnValue(false); }, 403],
  ])("rejects %s requests before touching the database", async (_name, arrange, status) => {
    arrange();
    const response = await postEntry(request(`/api/admin/finance/suppliers/${supplierId}/entries`, "POST", payment), context(supplierId));
    expect(response.status).toBe(status);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it.each([
    [{ ...payment, amount: "-5" }],
    [{ ...payment, currency: "AED" }],
    [{ ...payment, entry_type: "supplier_cost_payable" }],
    [{ ...payment, entry_type: "adjustment", note: "" }],
    [{ ...payment, entry_date: "2026-13-01" }],
  ])("validates entries server-side: %j", async (body) => {
    const response = await postEntry(request(`/api/admin/finance/suppliers/${supplierId}/entries`, "POST", body), context(supplierId));
    expect(response.status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("passes finance function messages through with a matching status", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: "22023", message: "Entries against this booking must be in EUR." } });
    let response = await postEntry(request(`/api/admin/finance/suppliers/${supplierId}/entries`, "POST", payment), context(supplierId));
    expect([response.status, (await response.json()).error]).toEqual([400, "Entries against this booking must be in EUR."]);
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: "42501", message: "Finance permission manage_finance is required." } });
    response = await postEntry(request(`/api/admin/finance/suppliers/${supplierId}/entries`, "POST", payment), context(supplierId));
    expect(response.status).toBe(403);
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: "XX000", message: "internal detail" } });
    response = await postEntry(request(`/api/admin/finance/suppliers/${supplierId}/entries`, "POST", payment), context(supplierId));
    expect([response.status, (await response.json()).error]).toEqual([500, "The finance update failed. Nothing was saved."]);
  });

  it("returns 503 with a clear message when the finance migrations are missing", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: "PGRST202", message: "Could not find the function" } });
    const response = await postEntry(request(`/api/admin/finance/suppliers/${supplierId}/entries`, "POST", payment), context(supplierId));
    expect(response.status).toBe(503);
    expect((await response.json()).configured).toBe(false);
  });

  it("requires an idempotency key for settlements and reports replays as 200", async () => {
    const url = `/api/admin/finance/suppliers/${supplierId}/settlements`;
    expect((await postSettlement(request(url, "POST", { line_ids: [lineId], entry_date: "2026-10-20" }), context(supplierId))).status).toBe(400);
    mocks.rpc.mockResolvedValueOnce({ data: { entries: 1, replayed: true }, error: null });
    const response = await postSettlement(request(url, "POST", { idempotency_key: key, line_ids: [lineId], entry_date: "2026-10-20" }), context(supplierId));
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("finance_post_net_settlement", { p_idempotency_key: key, p_supplier_id: supplierId, p_line_ids: [lineId], p_entry_date: "2026-10-20", p_note: null });
  });

  it("requires a note to reverse an entry", async () => {
    expect((await postReverse(request(`/api/admin/finance/ledger/${lineId}/reverse`, "POST", { note: "" }), context(lineId))).status).toBe(400);
    expect((await postReverse(request(`/api/admin/finance/ledger/${lineId}/reverse`, "POST", { note: "Entered twice" }), context(lineId))).status).toBe(201);
  });

  it("marks a trip collected through the validated line update", async () => {
    const response = await patchLine(request(`/api/admin/finance/lines/${lineId}`, "PATCH", { collected_by: "daily_red_sea", collection_status: "collected", collected_amount: 100 }), context(lineId));
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("finance_update_line", { p_line_id: lineId, p_changes: { collected_by: "daily_red_sea", collection_status: "collected", collected_amount: "100.00" } });
    expect((await patchLine(request(`/api/admin/finance/lines/${lineId}`, "PATCH", { selling_price: 1 }), context(lineId))).status).toBe(400);
    expect((await patchLine(request("/api/admin/finance/lines/not-a-uuid", "PATCH", { no_show: true }), context("not-a-uuid"))).status).toBe(400);
  });
});

describe("finance read routes", () => {
  it("requires view_finance", async () => {
    mocks.permission.mockResolvedValue(false);
    expect((await getSuppliers()).status).toBe(403);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("rejects invalid statement ranges", async () => {
    const response = await getStatement(request(`/api/admin/finance/suppliers/${supplierId}/statement?from=2026-10-10&to=2026-10-01`, "GET"), context(supplierId));
    expect(response.status).toBe(400);
  });
});
