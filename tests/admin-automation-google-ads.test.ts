import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRequiredAdminClient } from "@/utils/supabase/admin";
import { getGoogleAdsReport, googleAdsConfiguration } from "@/lib/google-ads";
import { runAdminAutomation } from "@/lib/admin-automation";

vi.mock("@/lib/booking-service", () => ({ sendBookingEmail: vi.fn(), sendWhatsAppMessage: vi.fn() }));
vi.mock("@/utils/supabase/admin", () => ({ createRequiredAdminClient: vi.fn() }));
vi.mock("@/lib/google-ads", () => ({ getGoogleAdsReport: vi.fn(), googleAdsConfiguration: vi.fn(), isDeveloperTokenNotApproved: vi.fn(() => false) }));
vi.mock("@/lib/finance/automation", () => ({ runFinanceAutomation: vi.fn(async () => ({})) }));

function database(insertError: { code: string } | null = null, existing: { id: string } | null = null) {
  const insert = vi.fn(async () => ({ error: insertError }));
  const lookup = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn(async () => ({ data: existing, error: null })) };
  const expenses = { insert, ...lookup };
  const from = vi.fn((table: string) => {
    if (table === "expenses") return expenses;
    const query: Record<string, unknown> = {};
    for (const method of ["update", "insert", "upsert", "select", "eq", "lte", "is", "in", "order", "limit"]) query[method] = vi.fn(() => query);
    query.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(resolve);
    return query;
  });
  vi.mocked(createRequiredAdminClient).mockReturnValue({ from, rpc: vi.fn(async () => ({ error: null })) } as unknown as ReturnType<typeof createRequiredAdminClient>);
  return expenses;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-09T06:00:00Z"));
  vi.mocked(googleAdsConfiguration).mockReturnValue({ configured: true } as ReturnType<typeof googleAdsConfiguration>);
  vi.mocked(getGoogleAdsReport).mockResolvedValue({ customerId: "123", currency: "EGP", totals: { cost: 42 } } as Awaited<ReturnType<typeof getGoogleAdsReport>>);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("daily Google Ads expense import", () => {
  it("inserts spend with finance source tracking and the account/date deduplication key", async () => {
    const db = database();
    const result = await runAdminAutomation();
    expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({ amount: 42, currency: "EGP", expense_date: "2026-11-08", source: "google_ads", source_ref: "google-ads:123:2026-11-08", external_reference: "google-ads:123:2026-11-08" }));
    expect(result).toMatchObject({ googleAdsSpendImported: 42, googleAdsStatus: "ok" });
  });

  it("skips an already imported day without reporting it as new spend", async () => {
    const db = database({ code: "23505" }, { id: "existing" });
    expect(await runAdminAutomation()).toMatchObject({ googleAdsSpendImported: 0, googleAdsStatus: "ok" });
    expect(db.eq).toHaveBeenCalledWith("external_reference", "google-ads:123:2026-11-08");
  });

  it("reports a unique violation without a matching expense as a failed import", async () => {
    database({ code: "23505" });
    expect(await runAdminAutomation()).toMatchObject({ googleAdsSpendImported: 0, googleAdsStatus: "error" });
  });

  it("reports database failures rather than treating them as duplicates", async () => {
    database({ code: "42501" });
    expect(await runAdminAutomation()).toMatchObject({ googleAdsSpendImported: 0, googleAdsStatus: "error" });
  });

  it("does not insert an expense when there is no spend", async () => {
    const db = database();
    vi.mocked(getGoogleAdsReport).mockResolvedValue({ customerId: "123", currency: "EGP", totals: { cost: 0 } } as Awaited<ReturnType<typeof getGoogleAdsReport>>);
    expect(await runAdminAutomation()).toMatchObject({ googleAdsSpendImported: 0, googleAdsStatus: "ok" });
    expect(db.insert).not.toHaveBeenCalled();
  });
});
