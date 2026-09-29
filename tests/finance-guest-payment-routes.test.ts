import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  user: { id: "admin-id", email: "accountant@example.com" } as { id: string; email: string } | null,
  permission: vi.fn(), origin: vi.fn(), rpc: vi.fn(), from: vi.fn(),
}));
vi.mock("@/lib/admin-permission", () => ({ hasLivePermission: mocks.permission }));
vi.mock("@/lib/request-origin", () => ({ hasValidRequestOrigin: mocks.origin }));
vi.mock("@/utils/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: mocks.user } }) }, rpc: mocks.rpc, from: mocks.from }) }));

import { POST as postPayment } from "@/app/api/admin/finance/bookings/[id]/payments/route";
import { POST as postCreditNote } from "@/app/api/admin/finance/bookings/[id]/credit-notes/route";
import { POST as postRedemption } from "@/app/api/admin/finance/bookings/[id]/credit-redemptions/route";
import { POST as postReverse } from "@/app/api/admin/finance/payments/[id]/reverse/route";

const bookingId = "10000000-0000-4000-8000-000000000001";
const key = "30000000-0000-4000-8000-000000000003";
const context = (id: string) => ({ params: Promise.resolve({ id }) });
const request = (url: string, body?: unknown) =>
  new NextRequest(`https://dailyredsea.com${url}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

/** Minimal PostgREST query stub: .select().eq().maybeSingle() resolves to `result`. */
const query = (result: unknown) => {
  const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => result };
  return chain;
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: "admin-id", email: "accountant@example.com" };
  mocks.origin.mockReturnValue(true);
  mocks.permission.mockImplementation(async (_client, _user, permission) => permission === "view_finance" || permission === "manage_finance");
  mocks.rpc.mockResolvedValue({ data: { id: "entry" }, error: null });
});

describe("guest payment routes", () => {
  const deposit = { idempotency_key: key, kind: "deposit", amount: "30.5", currency: "EUR", method: "cash", paid_on: "2026-08-05" };

  it("records a deposit with a normalized amount and the booking from the URL", async () => {
    const response = await postPayment(request(`/api/admin/finance/bookings/${bookingId}/payments`, { ...deposit, applied_amount: "" }), context(bookingId));
    expect(response.status).toBe(201);
    expect(mocks.rpc).toHaveBeenCalledWith("finance_record_guest_payment", {
      p_idempotency_key: key, p_booking_id: bookingId, p_kind: "deposit", p_amount: "30.50", p_currency: "EUR", p_method: "cash",
      p_paid_on: "2026-08-05", p_applied_amount: null, p_reference: null, p_note: null,
    });
  });

  it.each([
    ["signed-out", () => { mocks.user = null; }, 401],
    ["view-only staff", () => { mocks.permission.mockImplementation(async (_c, _u, permission) => permission === "view_finance"); }, 403],
    ["cross-origin", () => { mocks.origin.mockReturnValue(false); }, 403],
  ])("rejects %s requests before touching the database", async (_name, arrange, status) => {
    arrange();
    const response = await postPayment(request(`/api/admin/finance/bookings/${bookingId}/payments`, deposit), context(bookingId));
    expect(response.status).toBe(status);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it.each([
    [{ ...deposit, amount: "0" }],
    [{ ...deposit, amount: "12.345" }],
    [{ ...deposit, kind: "credit_note_issued" }],
    [{ ...deposit, method: "credit_note" }],
    [{ ...deposit, currency: "AED" }],
    [{ ...deposit, idempotency_key: "not-a-key" }],
    [{ ...deposit, paid_on: "2026-02-30" }],
  ])("validates payments server-side: %j", async (body) => {
    const response = await postPayment(request(`/api/admin/finance/bookings/${bookingId}/payments`, body), context(bookingId));
    expect(response.status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("passes the database's refund-limit message through", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: "23514", message: "Refunds (50.00 USD) cannot exceed what the guest has paid." } });
    const response = await postPayment(request(`/api/admin/finance/bookings/${bookingId}/payments`, { ...deposit, kind: "refund" }), context(bookingId));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("cannot exceed");
  });

  it("issues a credit note and rejects an expiry before the issue date", async () => {
    const note = { idempotency_key: key, amount: 120, issued_on: "2026-08-05", expires_on: "2027-08-05", reason: "Weather cancellation" };
    expect((await postCreditNote(request(`/api/admin/finance/bookings/${bookingId}/credit-notes`, note), context(bookingId))).status).toBe(201);
    expect(mocks.rpc).toHaveBeenCalledWith("finance_issue_credit_note", {
      p_idempotency_key: key, p_booking_id: bookingId, p_amount: "120.00", p_issued_on: "2026-08-05", p_reason: "Weather cancellation", p_expires_on: "2027-08-05",
    });
    mocks.rpc.mockClear();
    const late = await postCreditNote(request(`/api/admin/finance/bookings/${bookingId}/credit-notes`, { ...note, expires_on: "2026-08-01" }), context(bookingId));
    expect(late.status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("looks a credit note up by its number (case-insensitive) before redeeming it", async () => {
    const eq = vi.fn();
    const chain = { select: () => chain, eq: (column: string, value: string) => { eq(column, value); return chain; }, maybeSingle: async () => ({ data: { id: "cn-id" }, error: null }) };
    mocks.from.mockReturnValue(chain);
    const response = await postRedemption(request(`/api/admin/finance/bookings/${bookingId}/credit-redemptions`,
      { idempotency_key: key, credit_note: "cn-2026-0007", amount: "20", paid_on: "2026-08-10" }), context(bookingId));
    expect(response.status).toBe(201);
    expect(eq).toHaveBeenCalledWith("number", "CN-2026-0007");
    expect(mocks.rpc).toHaveBeenCalledWith("finance_redeem_credit_note", {
      p_idempotency_key: key, p_credit_note_id: "cn-id", p_booking_id: bookingId, p_amount: "20.00", p_paid_on: "2026-08-10", p_applied_amount: null,
    });
  });

  it("returns 404 for an unknown credit note number", async () => {
    mocks.from.mockReturnValue(query({ data: null, error: null }));
    const response = await postRedemption(request(`/api/admin/finance/bookings/${bookingId}/credit-redemptions`,
      { idempotency_key: key, credit_note: "CN-2026-9999", amount: "20", paid_on: "2026-08-10" }), context(bookingId));
    expect(response.status).toBe(404);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("requires a reason to reverse an entry", async () => {
    expect((await postReverse(request(`/api/admin/finance/payments/${bookingId}/reverse`, { note: "" }), context(bookingId))).status).toBe(400);
    expect((await postReverse(request(`/api/admin/finance/payments/${bookingId}/reverse`, { note: "Wrong booking" }), context(bookingId))).status).toBe(201);
    expect(mocks.rpc).toHaveBeenCalledWith("finance_reverse_guest_payment", { p_entry_id: bookingId, p_note: "Wrong booking" });
  });
});
