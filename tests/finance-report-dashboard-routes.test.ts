import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  user: { id: "admin-id", email: "accountant@example.com" } as { id: string; email: string } | null,
  permission: vi.fn(), dashboard: vi.fn(), transactions: vi.fn(),
}));
vi.mock("@/lib/admin-permission", () => ({ hasLivePermission: mocks.permission }));
vi.mock("@/utils/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: mocks.user } }) } }) }));
vi.mock("@/lib/finance/dashboard", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/finance/dashboard")>()),
  financeDashboard: mocks.dashboard,
  transactionsInRange: mocks.transactions,
}));

import { GET as getDashboard } from "@/app/api/admin/finance/dashboard/route";
import { GET as getExport } from "@/app/api/admin/finance/export/route";

const request = (url: string) => new NextRequest(`https://dailyredsea.com${url}`);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: "admin-id", email: "accountant@example.com" };
  mocks.permission.mockImplementation(async (_client, _user, permission) => permission === "view_finance");
  mocks.dashboard.mockResolvedValue({ pnl: {} });
  mocks.transactions.mockResolvedValue([]);
});

describe("reports dashboard route", () => {
  it("loads the requested range for finance staff", async () => {
    const response = await getDashboard(request("/api/admin/finance/dashboard?from=2026-09-01&to=2026-09-30"));
    expect(response.status).toBe(200);
    expect(mocks.dashboard).toHaveBeenCalledWith(expect.anything(), { from: "2026-09-01", to: "2026-09-30" });
  });

  it("rejects bad ranges, signed-out users and staff without finance access", async () => {
    expect((await getDashboard(request("/api/admin/finance/dashboard?from=2026-09-30&to=2026-09-01"))).status).toBe(400);
    mocks.user = null;
    expect((await getDashboard(request("/api/admin/finance/dashboard"))).status).toBe(401);
    mocks.user = { id: "ops", email: "ops@example.com" };
    mocks.permission.mockResolvedValue(false);
    expect((await getDashboard(request("/api/admin/finance/dashboard"))).status).toBe(403);
    expect(mocks.dashboard).not.toHaveBeenCalled();
  });
});

describe("transaction CSV export", () => {
  it("writes one row per transaction with readable headers and neutralised formulas", async () => {
    mocks.transactions.mockResolvedValue([
      { occurred_on: "2026-09-05", kind: "guest_deposit", category: "guests", reference: "DRS-1", counterparty: "=HYPERLINK(\"x\")", description: "Deposit, cash",
        currency: "EUR", amount: "20.00", fx_rate_to_usd: "1.162790697674", amount_usd: "23.26", vat_amount: "0.00", vat_usd: "0.00", method: "cash",
        is_cash: true, cash_effect_usd: "23.26", is_reversal: false, voided: false, created_by_email: "info@dailyredsea.com", recorded_at: "2026-09-05T10:00:00Z",
        source_table: "guest_payments", source_id: "abc" },
    ]);
    const response = await getExport(request("/api/admin/finance/export?from=2026-09-01&to=2026-09-30"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain("dailyredsea-transactions-2026-09-01-to-2026-09-30.csv");
    const text = await response.text();
    const lines = text.replace(/^﻿/, "").split("\r\n");
    expect(lines[0]).toBe("Daily Red Sea transactions,2026-09-01 to 2026-09-30,Reporting currency USD");
    expect(lines[3]).toContain("Date,Type,Category,Booking,Guest / partner / vendor");
    expect(lines[4]).toContain("2026-09-05,guest_deposit,guests,DRS-1,");
    expect(lines[4]).toContain(`"'=HYPERLINK(""x"")"`);
    expect(lines[4]).toContain("\"Deposit, cash\",EUR,20.00,1.162790697674,23.26");
    expect(lines[4]).toContain(",yes,23.26,no,no,info@dailyredsea.com,");
  });

  it("requires both dates", async () => {
    expect((await getExport(request("/api/admin/finance/export?from=2026-09-01"))).status).toBe(400);
    expect(mocks.transactions).not.toHaveBeenCalled();
  });
});
