import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ existing: { status: "cancelled" } as Record<string, unknown>, update: vi.fn(), permission: vi.fn() }));
vi.mock("@/lib/admin-permission", () => ({ hasLivePermission: mocks.permission }));
vi.mock("@/lib/request-origin", () => ({ hasValidRequestOrigin: () => true }));
vi.mock("@/lib/booking-status-notification", () => ({ sendBookingAndPaymentStatusNotification: vi.fn(async () => null) }));
vi.mock("@/lib/referral-notifications", () => ({ deliverReferralNotifications: vi.fn(async () => undefined) }));
vi.mock("@/lib/booking-assignment", () => ({ getCustomerVisibleAssignment: vi.fn(async () => ({})) }));
vi.mock("@/utils/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u", email: "ops@example.com" } } }) },
    rpc: vi.fn(async () => ({ error: null })),
    from: () => {
      let patch: Record<string, unknown> | null = null;
      const chain = {
        select: () => chain,
        eq: () => chain,
        update: (value: Record<string, unknown>) => { patch = value; mocks.update(value); return chain; },
        single: async () => ({ data: patch ? { ...mocks.existing, ...patch, reference: "DRS-1" } : { ...mocks.existing, reference: "DRS-1" }, error: null }),
      };
      return chain;
    },
  }),
}));

import { PATCH } from "@/app/api/admin/bookings/[id]/route";

const id = "10000000-0000-4000-8000-000000000001";
const patch = (body: unknown) => PATCH(new NextRequest(`https://dailyredsea.com/api/admin/bookings/${id}`, {
  method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
}), { params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.existing = { status: "cancelled", payment_status: "unpaid" };
  mocks.permission.mockResolvedValue(true);
});

describe("booking cancellation reason", () => {
  it("saves a reason and note on a cancelled booking", async () => {
    const response = await patch({ cancellation_reason: "weather", cancellation_note: " Port closed " });
    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith({ cancellation_reason: "weather", cancellation_note: "Port closed" });
  });

  it("accepts the reason together with the cancellation itself", async () => {
    mocks.existing = { status: "confirmed", payment_status: "paid" };
    const response = await patch({ status: "cancelled", cancellation_reason: "partner" });
    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith({ status: "cancelled", cancellation_reason: "partner", cancellation_note: null });
  });

  it("refuses a reason on a booking that is not cancelled, or an unknown reason", async () => {
    mocks.existing = { status: "confirmed" };
    expect((await patch({ cancellation_reason: "weather" })).status).toBe(400);
    mocks.existing = { status: "cancelled" };
    expect((await patch({ cancellation_reason: "bored" })).status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("no longer deletes bookings", async () => {
    const { DELETE } = await import("@/app/api/admin/bookings/[id]/route");
    expect((await DELETE()).status).toBe(405);
  });
});
