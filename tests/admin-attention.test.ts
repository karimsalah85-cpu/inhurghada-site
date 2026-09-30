import { describe, expect, it } from "vitest";
import { buildAdminAttention, cairoTomorrow, type AttentionBookingRow } from "@/lib/admin-attention";

// 2026-09-30 21:30 UTC is already 2026-10-01 00:30 in Cairo (UTC+3 in summer), so "tomorrow" is 10-02.
const lateEvening = new Date("2026-09-30T21:30:00Z");
const noon = new Date("2026-09-30T10:00:00Z");

const booking = (patch: Partial<AttentionBookingRow> = {}): AttentionBookingRow => ({
  id: "b1", reference: "DRS-1", customer_name: "Sample Guest", tour_name: "Boat trip", date: "2026-10-01",
  start_time: null, hotel: "Hotel A", status: "confirmed", archived_at: null, guests: 2, ...patch,
});

describe("cairoTomorrow", () => {
  it("uses the Cairo calendar day, not UTC", () => {
    expect(cairoTomorrow(noon)).toBe("2026-10-01");
    expect(cairoTomorrow(lateEvening)).toBe("2026-10-02");
  });
});

describe("tomorrow's trips", () => {
  it("flags trips with no live assignment and links to tomorrow's manifest", () => {
    const { items, tomorrow } = buildAdminAttention({
      now: noon,
      tomorrowBookings: [
        booking(),
        booking({ id: "b2", reference: "DRS-2", adults: 2, youth: 1, guests: null }),
        booking({ id: "b3", reference: "DRS-3" }),
        booking({ id: "b4", reference: "DRS-4", status: "cancelled" }),
      ],
      tomorrowAssignments: [
        { booking_id: "b2", pickup_time: "2026-10-01T05:00:00Z", status: "assigned" },
        { booking_id: "b3", pickup_time: "2026-10-01T05:00:00Z", status: "cancelled" },
      ],
    });
    const unassigned = items.find((item) => item.id === "tomorrow-unassigned")!;
    expect(unassigned.count).toBe(2);
    expect(unassigned.entries.map((entry) => entry.key)).toEqual(["b1", "b3"]);
    expect(unassigned.href).toBe("/admin/operations/manifest?date=2026-10-01");
    expect(items.some((item) => item.id === "tomorrow-no-pickup")).toBe(false);
    expect(tomorrow).toEqual({ date: "2026-10-01", bookings: 3, guests: 7, href: "/admin/operations/manifest?date=2026-10-01" });
  });

  it("flags assigned trips with neither an assignment pickup time nor a booking start time", () => {
    const { items } = buildAdminAttention({
      now: noon,
      tomorrowBookings: [booking(), booking({ id: "b2", reference: "DRS-2", start_time: "08:00" }), booking({ id: "b3", reference: "DRS-3" })],
      tomorrowAssignments: [
        { booking_id: "b1", pickup_time: null, status: "assigned" },
        { booking_id: "b2", pickup_time: null, status: "assigned" },
        { booking_id: "b3", pickup_time: null, status: "assigned" },
        { booking_id: "b3", pickup_time: "2026-10-01T05:00:00Z", status: "accepted" },
      ],
    });
    const noPickup = items.find((item) => item.id === "tomorrow-no-pickup")!;
    expect(noPickup.count).toBe(1);
    expect(noPickup.entries[0].key).toBe("b1");
    expect(items.some((item) => item.id === "tomorrow-unassigned")).toBe(false);
  });

  it("skips the dispatch items when assignments were not loaded, but keeps the pickups line", () => {
    const { items, tomorrow } = buildAdminAttention({ now: noon, tomorrowBookings: [booking()] });
    expect(items).toEqual([]);
    expect(tomorrow?.bookings).toBe(1);
  });
});

describe("supplier requests", () => {
  const request = (patch: Record<string, unknown> = {}) => ({
    id: "r1", booking_id: "b1", supplier_id: "s1", status: "sent", sent_at: "2026-09-29T08:00:00Z",
    last_sent_at: "2026-09-29T08:00:00Z", responded_at: null, supplier_name: "Blue Boat", ...patch,
  });

  it("lists requests still waiting after 12 hours, oldest first, linking to the booking", () => {
    const { items } = buildAdminAttention({
      now: noon,
      supplierRequests: [
        request(),
        request({ id: "r2", booking_id: "b2", last_sent_at: "2026-09-28T08:00:00Z" }),
        request({ id: "r3", last_sent_at: "2026-09-30T01:00:00Z" }), // 9h ago: not yet
        request({ id: "r4", status: "confirmed" }),
        request({ id: "r5", status: "change_requested" }), // supplier answered; the ball is with us
        request({ id: "r6", booking_id: "b3" }), // past trip
      ],
      supplierRequestBookings: [booking(), booking({ id: "b2", reference: "DRS-2", date: "2026-10-05" }), booking({ id: "b3", reference: "DRS-3", date: "2026-09-01" })],
    });
    const waiting = items.find((item) => item.id === "supplier-waiting")!;
    expect(waiting.count).toBe(2);
    expect(waiting.entries.map((entry) => entry.key)).toEqual(["r2", "r1"]);
    expect(waiting.entries[0].href).toBe("/admin/bookings?month=2026-10&search=DRS-2");
    expect(waiting.entries[0].detail).toContain("Blue Boat");
    expect(waiting.entries[0].detail).toContain("waiting 50h");
  });

  it("uses the reminder time, so a recent resend restarts the clock", () => {
    const { items } = buildAdminAttention({
      now: noon, supplierRequests: [request({ last_sent_at: "2026-09-30T08:00:00Z" })], supplierRequestBookings: [booking()],
    });
    expect(items).toEqual([]);
  });
});

describe("failed messages", () => {
  it("counts failures from the last 7 days, newest first", () => {
    const { items } = buildAdminAttention({
      now: noon,
      failedMessages: [
        { id: "q1", booking_id: "b1", channel: "email", recipient: "a@example.com", attempts: 1, scheduled_for: "2026-09-29T08:00:00Z", last_error: "bounced" },
        { id: "q2", booking_id: null, channel: "whatsapp", recipient: "+201000000000", attempts: 2, scheduled_for: "2026-09-30T08:00:00Z" },
        { id: "q3", booking_id: null, channel: "email", recipient: "old@example.com", attempts: 1, scheduled_for: "2026-09-10T08:00:00Z" },
      ],
    });
    const failed = items.find((item) => item.id === "failed-messages")!;
    expect(failed.count).toBe(2);
    expect(failed.href).toBe("/admin/messages");
    expect(failed.entries.map((entry) => entry.key)).toEqual(["q2", "q1"]);
    expect(failed.entries[1].detail).toContain("bounced");
  });

  it("skips every item whose rows were not loaded", () => {
    expect(buildAdminAttention({ now: noon })).toEqual({ items: [], tomorrow: null });
  });
});
