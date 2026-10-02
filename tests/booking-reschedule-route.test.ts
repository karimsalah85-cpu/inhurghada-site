import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  existing: {} as Record<string, unknown>,
  rescheduled: {} as Record<string, unknown>,
  rpcError: null as { code: string; message: string } | null,
  supplierRequests: 0,
  rpc: vi.fn(),
  permission: vi.fn(),
  send: vi.fn(),
}));
vi.mock("@/lib/admin-permission", () => ({ hasLivePermission: mocks.permission }));
vi.mock("@/lib/request-origin", () => ({ hasValidRequestOrigin: () => true }));
vi.mock("@/lib/booking-status-notification", () => ({ sendBookingAndPaymentStatusNotification: mocks.send }));
vi.mock("@/lib/booking-assignment", () => ({ getCustomerVisibleAssignment: vi.fn(async () => ({})) }));
vi.mock("@/utils/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u", email: "ops@example.com" } } }) },
    rpc: async (name: string, args: Record<string, unknown>) => {
      mocks.rpc(name, args);
      if (name !== "admin_reschedule_booking") return { data: null, error: null };
      return mocks.rpcError ? { data: null, error: mocks.rpcError } : { data: mocks.rescheduled, error: null };
    },
    from: (table: string) => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        in: async () => ({ count: mocks.supplierRequests, error: null }),
        single: async () => (table === "bookings" ? { data: mocks.existing, error: null } : { data: null, error: null }),
      };
      return chain;
    },
  }),
}));

import { POST } from "@/app/api/admin/bookings/[id]/reschedule/route";

const id = "10000000-0000-4000-8000-000000000001";
const post = (body: unknown) => POST(new NextRequest(`https://dailyredsea.com/api/admin/bookings/${id}/reschedule`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
}), { params: Promise.resolve({ id }) });
const rescheduleCall = () => mocks.rpc.mock.calls.find(([name]) => name === "admin_reschedule_booking")?.[1];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.existing = { id, reference: "DRS-1", tour_slug: "orange-bay", tour_name: "Orange Bay", date: "2026-11-01", start_time: null, status: "confirmed", payment_status: "unpaid", customer_email: "guest@example.com" };
  mocks.rescheduled = { ...mocks.existing, date: "2026-11-05" };
  mocks.rpcError = null;
  mocks.supplierRequests = 0;
  mocks.permission.mockResolvedValue(true);
  mocks.send.mockResolvedValue({ success: true });
});

describe("booking reschedule route", () => {
  it("moves the booking and emails the customer the old and new date", async () => {
    mocks.supplierRequests = 1;
    const response = await post({ date: "2026-11-05", notify: true });
    expect(response.status).toBe(200);
    expect(rescheduleCall()).toEqual({ p_booking_id: id, p_date: "2026-11-05", p_start_time: null, p_trip_index: null });
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ date: "2026-11-05", dateChange: { from: "2026-11-01", to: "2026-11-05", tripName: null } }));
    expect(mocks.rpc).toHaveBeenCalledWith("record_admin_audit", expect.objectContaining({ summary_text: "Rescheduled booking DRS-1 from 2026-11-01 to 2026-11-05" }));
    expect(await response.json()).toMatchObject({ changed: true, notification: { attempted: true, sent: true }, supplierRequests: 1 });
  });

  it("only emails when asked, and never for a completed or cancelled booking", async () => {
    expect((await (await post({ date: "2026-11-05" })).json()).notification).toEqual({ attempted: false, sent: false });
    for (const status of ["completed", "cancelled"]) {
      mocks.rescheduled = { ...mocks.existing, date: "2026-11-05", status };
      expect((await (await post({ date: "2026-11-05", notify: true })).json()).notification.attempted).toBe(false);
    }
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("reports a failed email without undoing the date change", async () => {
    mocks.send.mockResolvedValue({ success: false, reason: "gmail-auth-failed" });
    const body = await (await post({ date: "2026-11-05", notify: true })).json();
    expect(body).toMatchObject({ changed: true, booking: { date: "2026-11-05" }, notification: { attempted: true, sent: false, reason: "gmail-auth-failed" } });
  });

  it("names the trip that moved on a multi-trip booking", async () => {
    const trips = [{ name: "Reef Day", date: "2026-11-01" }, { name: "Desert Day", date: "2026-11-03" }];
    mocks.existing = { ...mocks.existing, tour_slug: "multi-trip", pricing_snapshot: { trips } };
    mocks.rescheduled = { ...mocks.existing, pricing_snapshot: { trips: [trips[0], { name: "Desert Day", date: "2026-11-09" }] } };
    const response = await post({ date: "2026-11-09", trip_index: 1, notify: true });
    expect(response.status).toBe(200);
    expect(rescheduleCall()).toMatchObject({ p_trip_index: 1 });
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ dateChange: { from: "2026-11-03", to: "2026-11-09", tripName: "Desert Day" } }));
    expect((await post({ date: "2026-11-09", trip_index: 5 })).status).toBe(400);
  });

  it("does nothing when the booking is already on that date", async () => {
    mocks.rescheduled = { ...mocks.existing };
    const body = await (await post({ date: "2026-11-01", notify: true })).json();
    expect(body).toMatchObject({ changed: false, notification: { attempted: false } });
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalledWith("record_admin_audit", expect.anything());
  });

  it("passes a new pickup time for timed bookings", async () => {
    mocks.existing = { ...mocks.existing, start_time: "20:30:00" };
    mocks.rescheduled = { ...mocks.existing, start_time: "09:15:00" };
    const body = await (await post({ date: "2026-11-01", start_time: "09:15" })).json();
    expect(rescheduleCall()).toMatchObject({ p_start_time: "09:15" });
    expect(body.changed).toBe(true);
  });

  it("rejects invalid input and unauthorised staff", async () => {
    expect((await post({ date: "2026-02-30" })).status).toBe(400);
    expect((await post({ date: "05/11/2026" })).status).toBe(400);
    expect((await post({ date: "2026-11-05", start_time: "25:00" })).status).toBe(400);
    expect((await post({ date: "2026-11-05", trip_index: -1 })).status).toBe(400);
    mocks.permission.mockResolvedValue(false);
    expect((await post({ date: "2026-11-05" })).status).toBe(401);
    expect(rescheduleCall()).toBeUndefined();
  });

  it("shows capacity conflicts to staff and hides unexpected database errors", async () => {
    mocks.rpcError = { code: "P0001", message: "Only 2 places remain on 2026-11-05; this booking needs 4." };
    const conflict = await post({ date: "2026-11-05", notify: true });
    expect(conflict.status).toBe(409);
    expect((await conflict.json()).error).toContain("Only 2 places remain");
    expect(mocks.send).not.toHaveBeenCalled();

    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.rpcError = { code: "XX000", message: "relation secret_table does not exist" };
    const failure = await post({ date: "2026-11-05" });
    expect(failure.status).toBe(500);
    expect((await failure.json()).error).toBe("Could not change the booking date.");
  });
});
