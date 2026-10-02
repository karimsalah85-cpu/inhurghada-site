import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { actAs, createBooking, createFinanceDatabase, createStaff, lines, owner, system, type FinanceDb } from "./support/finance-db";

let db: FinanceDb;

beforeAll(async () => { db = await createFinanceDatabase(); }, 120_000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => { await actAs(db, system); });

const isoDate = (value: unknown) => (value instanceof Date ? value.toISOString().slice(0, 10) : value);

async function reschedule(id: string, date: string, options: { time?: string | null; trip?: number | null } = {}) {
  await actAs(db, owner);
  try {
    const { rows } = await db.query<Record<string, unknown>>(
      "select * from public.admin_reschedule_booking($1, $2, $3, $4)",
      [id, date, options.time ?? null, options.trip ?? null],
    );
    return rows[0];
  } finally {
    await actAs(db, system);
  }
}

async function slot(tourSlug: string, date: string, capacity: number | null, options: { blocked?: boolean; reserved?: number } = {}) {
  const { rows } = await db.query<{ id: string }>(
    "insert into public.tour_availability(tour_slug, service_date, capacity, blocked, reserved) values ($1, $2, $3, $4, $5) returning id",
    [tourSlug, date, capacity, options.blocked ?? false, options.reserved ?? 0],
  );
  return rows[0].id;
}

const reserved = async (id: string) => Number((await db.query<{ reserved: number }>("select reserved from public.tour_availability where id = $1", [id])).rows[0].reserved);

describe("admin_reschedule_booking", () => {
  it("moves a single trip, its reserved places and its finance line", async () => {
    const from = await slot("move-reef", "2026-11-01", 10, { reserved: 3 });
    const to = await slot("move-reef", "2026-11-05", 10);
    const booking = await createBooking(db, { amount: 90, tour_slug: "move-reef", date: "2026-11-01", guests: 3 });

    const moved = await reschedule(booking, "2026-11-05");

    expect(isoDate(moved.date)).toBe("2026-11-05");
    expect(await reserved(from)).toBe(0);
    expect(await reserved(to)).toBe(3);
    expect(isoDate((await lines(db, booking))[0].trip_date)).toBe("2026-11-05");
  });

  it("refuses a full or blocked date and leaves the booking untouched", async () => {
    const from = await slot("full-reef", "2026-11-01", 10, { reserved: 4 });
    await slot("full-reef", "2026-11-02", 5, { reserved: 3 });
    await slot("full-reef", "2026-11-03", 10, { blocked: true });
    const booking = await createBooking(db, { amount: 90, tour_slug: "full-reef", date: "2026-11-01", guests: 4 });

    await expect(reschedule(booking, "2026-11-02")).rejects.toThrow(/Only 2 places remain/);
    await expect(reschedule(booking, "2026-11-03")).rejects.toThrow(/blocked/);

    expect(await reserved(from)).toBe(4);
    const { rows } = await db.query<{ date: unknown }>("select date from public.bookings where id = $1", [booking]);
    expect(isoDate(rows[0].date)).toBe("2026-11-01");
  });

  it("does not touch capacity for a cancelled booking", async () => {
    const to = await slot("cancelled-reef", "2026-11-05", 2, { reserved: 2 });
    const booking = await createBooking(db, { amount: 90, tour_slug: "cancelled-reef", date: "2026-11-01", guests: 3, status: "cancelled" });

    const moved = await reschedule(booking, "2026-11-05");

    expect(isoDate(moved.date)).toBe("2026-11-05");
    expect(await reserved(to)).toBe(2);
  });

  it("changes the pickup time of a transfer", async () => {
    const booking = await createBooking(db, { amount: 40, type: "transfer", tour_slug: "hurghada-airport-transfer", date: "2026-11-01" });
    await db.query("update public.bookings set start_time = '20:30' where id = $1", [booking]);

    const moved = await reschedule(booking, "2026-11-02", { time: "09:15" });

    expect(isoDate(moved.date)).toBe("2026-11-02");
    expect(String(moved.start_time).slice(0, 5)).toBe("09:15");
  });

  it("moves one trip of a multi-trip booking in the snapshot, the notes and the finance lines", async () => {
    const snapshot = {
      version: 1, currency: "USD", subtotal: 100, pending: false,
      trips: [
        { name: "Reef Day", date: "2026-11-01", time: "08:00", guests: 2, participants: { adults: 2, youth: 0, infants: 0 }, lines: [{ kind: "adults", quantity: 2, unitPrice: 20, total: 40 }] },
        { name: "Desert Day", date: "2026-11-03", time: "14:00", guests: 2, participants: { adults: 2, youth: 0, infants: 0 }, lines: [{ kind: "adults", quantity: 2, unitPrice: 30, total: 60 }] },
      ],
    };
    const booking = await createBooking(db, { amount: 100, tour_slug: "multi-trip", tour_name: "Multi-trip booking", date: "2026-11-01", guests: 4, pricing_snapshot: snapshot });
    const notes = "1. Reef Day\nDate: 2026-11-01\nTime: 08:00\nTravelers: 2 adults\nTrip total: $40.00\n\n2. Desert Day\nDate: 2026-11-03\nTime: 14:00\nTravelers: 2 adults\nTrip total: $60.00\n\nCustomer note: Date: 2026-11-01 is my birthday";
    await db.query("update public.bookings set notes = $2 where id = $1", [booking, notes]);

    await expect(reschedule(booking, "2026-11-09")).rejects.toThrow(/Choose which trip/);
    const moved = await reschedule(booking, "2026-11-09", { trip: 0 });

    const trips = (moved.pricing_snapshot as { trips: { date: string }[] }).trips;
    expect(trips.map((trip) => trip.date)).toEqual(["2026-11-09", "2026-11-03"]);
    // The booking date follows the earliest trip; the customer's own note is never rewritten.
    expect(isoDate(moved.date)).toBe("2026-11-03");
    expect(moved.notes).toBe(notes.replace("1. Reef Day\nDate: 2026-11-01", "1. Reef Day\nDate: 2026-11-09"));
    expect((await lines(db, booking)).map((line) => isoDate(line.trip_date))).toEqual(["2026-11-09", "2026-11-03"]);
  });

  it("moves a held multi-trip reservation to the new date's slot", async () => {
    await db.query("insert into public.finance_tour_dimensions(tour_slug, tour_name, destination, product_line) values ('held-reef', 'Held Reef', 'hurghada', 'tour') on conflict do nothing");
    const from = await slot("held-reef", "2026-12-01", 10, { reserved: 2 });
    const to = await slot("held-reef", "2026-12-04", 10);
    const snapshot = { version: 1, currency: "USD", subtotal: 40, pending: false, trips: [{ name: "Held Reef", date: "2026-12-01", guests: 2, participants: { adults: 2, youth: 0, infants: 0 }, lines: [{ kind: "adults", quantity: 2, unitPrice: 20, total: 40 }] }] };
    const booking = await createBooking(db, { amount: 40, tour_slug: "multi-trip", date: "2026-12-01", guests: 2, pricing_snapshot: snapshot });
    await db.query("insert into public.booking_capacity_reservations(booking_id, availability_id, places) values ($1, $2, 2)", [booking, from]);

    await reschedule(booking, "2026-12-04");

    expect(await reserved(from)).toBe(0);
    expect(await reserved(to)).toBe(2);
    const { rows } = await db.query<{ availability_id: string }>("select availability_id from public.booking_capacity_reservations where booking_id = $1", [booking]);
    expect(rows.map((row) => row.availability_id)).toEqual([to]);
  });

  it("re-queues the pickup reminder for the new date", async () => {
    const booking = await createBooking(db, { amount: 90, tour_slug: "reminder-reef", date: "2026-11-01" });
    await db.query(`insert into public.communication_templates(name, channel, event_key, locale, body)
      values ('Pickup reminder', 'email', 'pickup_reminder', 'en', 'See you tomorrow'), ('Review request', 'email', 'review_request', 'en', 'How was it?')
      on conflict (event_key, channel, locale) do nothing`);
    await db.query(
      `insert into public.communication_queue(booking_id, template_id, channel, recipient, status, scheduled_for)
       select $1, id, 'email', 'guest@example.com', 'sent', now() from public.communication_templates where event_key in ('pickup_reminder', 'review_request') and channel = 'email' and locale = 'en'`,
      [booking],
    );
    expect((await db.query("select 1 from public.communication_queue where booking_id = $1", [booking])).rows).toHaveLength(2);

    await reschedule(booking, "2026-11-08");

    const { rows } = await db.query<{ event_key: string }>("select t.event_key from public.communication_queue q join public.communication_templates t on t.id = q.template_id where q.booking_id = $1", [booking]);
    expect(rows.map((row) => row.event_key)).toEqual(["review_request"]);
  });

  it("is limited to staff who can edit bookings", async () => {
    const booking = await createBooking(db, { amount: 90, tour_slug: "guarded-reef", date: "2026-11-01" });
    await expect(db.query("select public.admin_reschedule_booking($1, '2026-11-02')", [booking])).rejects.toThrow(/permission/);
    await actAs(db, await createStaff(db, "content_editor"));
    await expect(db.query("select public.admin_reschedule_booking($1, '2026-11-02')", [booking])).rejects.toThrow(/permission/);
  });
});
