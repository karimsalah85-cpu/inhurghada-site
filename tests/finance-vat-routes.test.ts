import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { normalizeExpensePayload } from "@/lib/admin-expense-write";

const mocks = vi.hoisted(() => ({
  user: { id: "admin-id", email: "accountant@example.com" } as { id: string; email: string } | null,
  permission: vi.fn(), origin: vi.fn(), rpc: vi.fn(),
}));
vi.mock("@/lib/admin-permission", () => ({ hasLivePermission: mocks.permission }));
vi.mock("@/lib/request-origin", () => ({ hasValidRequestOrigin: mocks.origin }));
vi.mock("@/utils/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: mocks.user } }) }, rpc: mocks.rpc }) }));

import { POST as createRate } from "@/app/api/admin/finance/tax-rates/route";
import { PATCH as updateRate } from "@/app/api/admin/finance/tax-rates/[id]/route";
import { POST as setTax } from "@/app/api/admin/finance/tax/route";

const id = "30000000-0000-4000-8000-000000000003";
const request = (method: string, body: unknown) =>
  new NextRequest("https://dailyredsea.com/api/admin/finance/x", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: "admin-id", email: "accountant@example.com" };
  mocks.origin.mockReturnValue(true);
  mocks.permission.mockImplementation(async (_client, _user, permission) => permission === "view_finance" || permission === "manage_finance");
  mocks.rpc.mockResolvedValue({ data: { id }, error: null });
});

describe("VAT rate routes", () => {
  const rate = { code: "vat-std", name: "Standard VAT", rate_percent: "14", applies_to: "both", effective_from: "2026-01-01" };

  it("creates a rate with an upper-cased code and no hard-coded values", async () => {
    expect((await createRate(request("POST", { ...rate, default_for_purchases: true }))).status).toBe(201);
    expect(mocks.rpc).toHaveBeenCalledWith("finance_create_tax_rate", {
      p_code: "VAT-STD", p_name: "Standard VAT", p_rate_percent: "14", p_applies_to: "both", p_effective_from: "2026-01-01",
      p_effective_to: null, p_default_for_sales: false, p_default_for_purchases: true, p_note: null,
      p_country: null,
    });
  });

  it.each([
    [{ ...rate, rate_percent: "101" }],
    [{ ...rate, rate_percent: "14.12345" }],
    [{ ...rate, code: "x" }],
    [{ ...rate, applies_to: "imports" }],
    [{ ...rate, effective_to: "2025-12-31" }],
    [{ ...rate, applies_to: "purchases", default_for_sales: true }],
  ])("validates new rates server-side: %j", async (body) => {
    expect((await createRate(request("POST", body))).status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("reports a duplicate code clearly", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: "23505", message: "duplicate key" } });
    const response = await createRate(request("POST", rate));
    expect([response.status, (await response.json()).error]).toEqual([409, "A rate with code VAT-STD already exists."]);
  });

  it("never sends a percent change when updating a rate", async () => {
    expect((await updateRate(request("PATCH", { rate_percent: "15" }), { params: Promise.resolve({ id }) })).status).toBe(400);
    expect((await updateRate(request("PATCH", { effective_to: "2026-12-31" }), { params: Promise.resolve({ id }) })).status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("finance_update_tax_rate", { p_id: id, p_changes: { effective_to: "2026-12-31" } });
  });

  it("sets or clears VAT on a transaction and is refused to view-only staff", async () => {
    expect((await setTax(request("POST", { target: "expense", id, tax_rate_id: "" }))).status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("finance_set_transaction_tax", { p_target: "expense", p_id: id, p_tax_rate_id: null });
    expect((await setTax(request("POST", { target: "refund", id, tax_rate_id: id }))).status).toBe(400);
    mocks.permission.mockImplementation(async (_c, _u, permission) => permission === "view_finance");
    expect((await setTax(request("POST", { target: "sales", id, tax_rate_id: id }))).status).toBe(403);
  });
});

describe("expense VAT field", () => {
  const base = { description: "Fuel", amount: "100", currency: "EGP", date: "2026-06-10" };
  it("keeps 'use the default' (omitted) apart from 'no VAT' (empty)", () => {
    expect(normalizeExpensePayload(base)).toMatchObject({ value: { taxRateId: undefined } });
    expect(normalizeExpensePayload({ ...base, tax_rate_id: "" })).toMatchObject({ value: { taxRateId: null } });
    expect(normalizeExpensePayload({ ...base, tax_rate_id: id })).toMatchObject({ value: { taxRateId: id } });
    expect(normalizeExpensePayload({ ...base, tax_rate_id: "14%" })).toHaveProperty("error");
  });
});
