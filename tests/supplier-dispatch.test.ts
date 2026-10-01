import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { isKnownApplicationPath } from "@/lib/public-routes";
import {
  buildSupplierBookingDetails, buildSupplierEmail, buildSupplierMessage, detailRows, redactEmails, supplierTransition, whatsappDigits,
  type SupplierBookingRow,
} from "@/lib/supplier-dispatch";
import { createSupplierRequestToken, supplierRequestUrl, verifySupplierRequestToken } from "@/lib/supplier-request-token";
import { createTicketToken } from "@/lib/ticket-token";
import { createBooking, createFinanceDatabase, createSupplier, type FinanceDb } from "./support/finance-db";

const booking: SupplierBookingRow = {
  reference: "DRS-ABC123",
  type: "tour",
  customer_name: "Anna Müller",
  phone: "+49 170 1234567",
  tour_name: "Orange Bay",
  date: "2026-10-12",
  start_time: "08:00:00",
  guests: 3,
  adults: 2,
  youth: 1,
  infants: 0,
  hotel: "Steigenberger Al Dau",
  notes: "Non-swimmer child. Guest email anna@example.com, please call instead.",
  amount: 120,
  currency: "EUR",
  payment_status: "unpaid",
  status: "confirmed",
};

const requestId = "0f8fad5b-d9cb-469f-a165-70867728950e";

describe("supplier booking details", () => {
  it("never shares the guest email, even when it appears in the notes", () => {
    const details = buildSupplierBookingDetails({ ...booking, customer_email: "anna@example.com" } as SupplierBookingRow);
    const everything = JSON.stringify(details) + buildSupplierMessage({ kind: "request", supplierName: "Captain Ali", details, link: "https://x/s" }) + buildSupplierEmail({ kind: "request", supplierName: "Captain Ali", details, link: "https://x/s" }).html;
    expect(everything).not.toContain("anna@example.com");
    expect(details.notes).toContain("[email hidden]");
    expect(details.guestPhone).toBe("+49 170 1234567");
    expect(details.guestName).toBe("Anna Müller");
  });

  it("only shares the guest price when the admin opts in", () => {
    expect(buildSupplierBookingDetails(booking).guestPayment).toBeNull();
    expect(buildSupplierBookingDetails(booking, { includeGuestPrice: true }).guestPayment).toEqual({ status: "to_collect", amount: 120, currency: "EUR" });
    const rows = detailRows(buildSupplierBookingDetails(booking, { includeGuestPrice: true }));
    expect(rows.find(([label]) => label === "Guest payment")?.[1]).toBe("To collect: €120.00");
  });

  it("uses per-trip data from the pricing snapshot, including extras", () => {
    const details = buildSupplierBookingDetails({
      ...booking,
      pricing_snapshot: { trips: [
        { name: "Orange Bay", date: "2026-10-12", time: "08:00", guests: 3, participants: { adults: 2, youth: 1, infants: 0 }, lines: [{ kind: "extra", label: "Lunch", quantity: 3 }] },
        { name: "Quad safari", date: "2026-10-14", time: "14:30", guests: 2, participants: null, lines: [] },
      ] },
    });
    expect(details.trips).toHaveLength(2);
    expect(details.trips[0]).toMatchObject({ name: "Orange Bay", time: "08:00", adults: 2, youth: 1, extras: ["Lunch ×3"] });
    const rows = detailRows(details);
    expect(rows.map(([label]) => label)).toEqual(expect.arrayContaining(["Trip 1", "Trip 2 date", "Trip 1 extras"]));
  });

  it("falls back to the booking row and summarises transfers", () => {
    const details = buildSupplierBookingDetails({
      ...booking, type: "transfer", tour_name: null,
      transfer_details: { direction: "airport_to_hotel", zone: "makadi", trip_type: "one_way", flight_number: "LH1234", luggage: { large_bags: 2, cabin_bags: 1, oversized_items: [] }, child_seats: { booster: 1 }, wheelchair: "none", allocated_vehicles: [{ vehicle_class: "minivan", count: 1 }] },
    });
    expect(details.kind).toBe("transfer");
    expect(details.trips[0]).toMatchObject({ name: "Transfer", time: "08:00", guests: 3 });
    expect(details.transfer).toMatchObject({ route: "airport to hotel · makadi · one way", flight: "LH1234", luggage: "2 large · 1 cabin", childSeats: "1 booster", wheelchair: null, vehicles: "1× minivan" });
  });

  it("builds a WhatsApp message with the link and an Arabic call to action", () => {
    const details = buildSupplierBookingDetails(booking);
    const message = buildSupplierMessage({ kind: "request", supplierName: "Captain Ali", details, link: "https://dailyredsea.com/supplier/abc", amountDue: { amount: 1500, currency: "EGP" } });
    expect(message).toContain("Hello Captain Ali");
    expect(message).toContain("• Pickup: Steigenberger Al Dau");
    expect(message).toContain("• Your payment: EGP");
    expect(message).toContain("https://dailyredsea.com/supplier/abc");
    expect(message).toMatch(/[؀-ۿ]/);
    const cancelled = buildSupplierMessage({ kind: "cancelled", supplierName: "Captain Ali", details, link: "https://dailyredsea.com/supplier/abc" });
    expect(cancelled).toContain("has been cancelled");
    expect(cancelled).not.toContain("https://dailyredsea.com/supplier/abc");
  });

  it("keeps medical details private unless the admin chooses to share them", () => {
    const details = buildSupplierBookingDetails({ ...booking, guest_requirements: { nonSwimmers: 1, medical: "Asthma" } });
    expect(detailRows(details)).toEqual(expect.arrayContaining([["Medical", "Yes — ask the Daily Red Sea office for details"]]));
    expect(JSON.stringify(details)).not.toContain("Asthma");
  });

  it("shares medical (when ticked), non-swimmer and certification needs, but never an email", () => {
    const details = buildSupplierBookingDetails({ ...booking, guest_requirements: { nonSwimmers: 1, medical: "Asthma — ask anna@example.com", certification: "open_water", certificationNumber: "SSI-42", dietary: "Vegetarian" } }, { includeMedical: true });
    const rows = detailRows(details);
    expect(rows).toEqual(expect.arrayContaining([["Non-swimmers", "1"], ["Medical", "Asthma — ask [email hidden]"], ["Diving certification", "Open Water (#SSI-42)"], ["Dietary", "Vegetarian"]]));
    expect(JSON.stringify(details)).not.toContain("anna@example.com");
    expect(buildSupplierMessage({ kind: "request", supplierName: "Dive centre", details, link: "https://x" })).toContain("• Non-swimmers: 1");
    // Requests created before requirements existed still render.
    expect(() => detailRows({ ...details, requirements: undefined })).not.toThrow();
  });

  it("escapes HTML in emails", () => {
    const details = buildSupplierBookingDetails({ ...booking, hotel: "<script>x</script>" });
    expect(buildSupplierEmail({ kind: "request", supplierName: "A&B", details, link: "https://x" }).html).not.toContain("<script>");
  });

  it("redacts emails from free text", () => {
    expect(redactEmails("mail me at a.b+c@d-e.co.uk now")).toBe("mail me at [email hidden] now");
  });

  it("normalises WhatsApp numbers", () => {
    expect(whatsappDigits("01012345678")).toBe("201012345678");
    expect(whatsappDigits("+20 101 234 5678")).toBe("201012345678");
    expect(whatsappDigits("0049 170 1234567")).toBe("491701234567");
    expect(whatsappDigits("123")).toBeNull();
    expect(whatsappDigits(null)).toBeNull();
  });
});

describe("supplier response state machine", () => {
  const at = (status: string, payment_status = "none") => ({ status, payment_status }) as Parameters<typeof supplierTransition>[0];

  it("confirms open requests and treats a repeat as a no-op", () => {
    expect(supplierTransition(at("sent"), "confirm")).toMatchObject({ ok: true, noop: false, status: "confirmed" });
    expect(supplierTransition(at("change_requested"), "confirm")).toMatchObject({ ok: true, status: "confirmed" });
    expect(supplierTransition(at("confirmed"), "confirm")).toMatchObject({ ok: true, noop: true });
    expect(supplierTransition(at("declined"), "confirm")).toEqual({ ok: false, reason: "not_allowed" });
  });

  it("lets a supplier back out after confirming, but nothing works on cancelled requests", () => {
    expect(supplierTransition(at("confirmed"), "decline")).toMatchObject({ ok: true, status: "declined" });
    expect(supplierTransition(at("cancelled"), "confirm")).toEqual({ ok: false, reason: "cancelled" });
    expect(supplierTransition(at("cancelled"), "decline")).toEqual({ ok: false, reason: "cancelled" });
  });

  it("requires a note to ask for a change", () => {
    expect(supplierTransition(at("sent"), "change", " ")).toEqual({ ok: false, reason: "note_required" });
    expect(supplierTransition(at("sent"), "change", "08:30 pickup please")).toMatchObject({ ok: true, status: "change_requested" });
    expect(supplierTransition(at("declined"), "change", "actually yes")).toEqual({ ok: false, reason: "not_allowed" });
  });

  it("handles payment acknowledgement only after a payment was sent", () => {
    expect(supplierTransition(at("confirmed", "none"), "payment_received")).toEqual({ ok: false, reason: "no_payment" });
    expect(supplierTransition(at("confirmed", "sent"), "payment_received")).toMatchObject({ ok: true, paymentStatus: "received" });
    expect(supplierTransition(at("confirmed", "sent"), "payment_disputed")).toEqual({ ok: false, reason: "note_required" });
    expect(supplierTransition(at("confirmed", "sent"), "payment_disputed", "only half arrived")).toMatchObject({ ok: true, paymentStatus: "disputed" });
    expect(supplierTransition(at("confirmed", "disputed"), "payment_received")).toMatchObject({ ok: true, paymentStatus: "received" });
    expect(supplierTransition(at("confirmed", "received"), "payment_disputed", "oops")).toEqual({ ok: false, reason: "not_allowed" });
    // A payment can still be acknowledged on a request cancelled after the supplier was paid a fee.
    expect(supplierTransition(at("cancelled", "sent"), "payment_received")).toMatchObject({ ok: true });
  });
});

describe("supplier request links", () => {
  const previous = process.env.TICKET_SIGNING_SECRET;
  beforeEach(() => { process.env.TICKET_SIGNING_SECRET = "test-ticket-secret"; });
  afterEach(() => { if (previous === undefined) delete process.env.TICKET_SIGNING_SECRET; else process.env.TICKET_SIGNING_SECRET = previous; });

  it("round-trips a request id and rejects tampering", () => {
    const token = createSupplierRequestToken(requestId);
    expect(verifySupplierRequestToken(token)).toBe(requestId);
    expect(verifySupplierRequestToken(encodeURIComponent(token))).toBe(requestId);
    const otherId = token.replace(/^0/, "1");
    expect(verifySupplierRequestToken(otherId)).toBeNull();
    expect(verifySupplierRequestToken(`${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`)).toBeNull();
    expect(verifySupplierRequestToken("")).toBeNull();
    expect(verifySupplierRequestToken("%E0%A4%A")).toBeNull();
    expect(supplierRequestUrl(requestId)).toMatch(/\/supplier\/[0-9a-f]{32}\.[A-Za-z0-9_-]{27}$/);
  });

  it("does not accept ticket tokens or links signed with another secret", () => {
    expect(verifySupplierRequestToken(createTicketToken("DRS-ABC123", 0))).toBeNull();
    const token = createSupplierRequestToken(requestId);
    process.env.TICKET_SIGNING_SECRET = "a-different-secret";
    expect(verifySupplierRequestToken(token)).toBeNull();
  });

  it("is routed only at /supplier/<token> without a locale prefix", () => {
    expect(isKnownApplicationPath("/supplier/abc.def")).toBe(true);
    expect(isKnownApplicationPath("/en/supplier/abc.def")).toBe(false);
    expect(isKnownApplicationPath("/supplier")).toBe(false);
    expect(isKnownApplicationPath("/supplier/a/b")).toBe(false);
  });
});

describe("supplier_booking_requests schema", () => {
  let db: FinanceDb;
  beforeAll(async () => { db = await createFinanceDatabase(); }, 120_000);
  afterAll(async () => { await db?.close(); });

  const insert = (bookingId: string, supplierId: string, extra = "") =>
    db.query<{ id: string }>(`insert into public.supplier_booking_requests (booking_id, supplier_id, details${extra ? ", " + extra.split("=")[0] : ""}) values ($1, $2, '{}'::jsonb${extra ? ", " + extra.split("=")[1] : ""}) returning id`, [bookingId, supplierId]);

  it("allows one live request per supplier per booking and keeps closed ones as history", async () => {
    const bookingId = await createBooking(db, { amount: 100 });
    const supplierId = await createSupplier(db);
    const first = await insert(bookingId, supplierId);
    await expect(insert(bookingId, supplierId)).rejects.toThrow(/supplier_booking_requests_live_unique/);
    await db.query("update public.supplier_booking_requests set status = 'declined' where id = $1", [first.rows[0].id]);
    await expect(insert(bookingId, supplierId)).resolves.toBeTruthy();
  });

  it("rejects invalid statuses, currencies and half-recorded payments", async () => {
    const bookingId = await createBooking(db, { amount: 100 });
    const supplierId = await createSupplier(db);
    await expect(insert(bookingId, supplierId, "status='maybe'")).rejects.toThrow();
    await expect(insert(bookingId, supplierId, "amount_due=10")).rejects.toThrow(); // currency missing
    await expect(insert(bookingId, supplierId, "payment_status='sent'")).rejects.toThrow(); // amount missing
    const { rows } = await insert(bookingId, supplierId);
    await expect(db.query("insert into public.supplier_booking_request_events (request_id, event_type, actor) values ($1, 'teleported', 'x')", [rows[0].id])).rejects.toThrow();
    await db.query("insert into public.supplier_booking_request_events (request_id, event_type, actor) values ($1, 'viewed', 'Supplier: Test')", [rows[0].id]);
  });

  it("is not readable by signed-in or anonymous database roles", async () => {
    const { rows } = await db.query<{ anon: boolean; authed: boolean; service: boolean }>(`select
      has_table_privilege('anon', 'public.supplier_booking_requests', 'select') as anon,
      has_table_privilege('authenticated', 'public.supplier_booking_requests', 'select') as authed,
      has_table_privilege('service_role', 'public.supplier_booking_requests', 'update') as service`);
    expect(rows[0]).toEqual({ anon: false, authed: false, service: true });
  });
});
