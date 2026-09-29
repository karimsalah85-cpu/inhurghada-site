import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  actAs, assignSupplier, createBooking, createFinanceDatabase, createStaff, createSupplier, ledger, lines, n, owner, setRate, system,
  type FinanceDb,
} from "./support/finance-db";

let db: FinanceDb;

beforeAll(async () => {
  db = await createFinanceDatabase();
  for (const date of ["2026-09-01", "2026-08-01", "2026-08-05", "2026-08-10", "2026-08-12"]) {
    await setRate(db, date, "EUR", 0.8);
    await setRate(db, date, "EGP", 50);
    await setRate(db, date, "GBP", 0.75);
    await setRate(db, date, "SAR", 3.75);
  }
}, 120_000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => { await actAs(db, system); });

type Row = Record<string, unknown>;

async function asOwner<T>(work: () => Promise<T>) {
  await actAs(db, owner);
  try { return await work(); } finally { await actAs(db, system); }
}

async function pay(bookingId: string, kind: string, amount: number, options: { currency?: string; method?: string; on?: string; applied?: number | null; key?: string } = {}) {
  return asOwner(async () => (await db.query<Row>(
    "select * from public.finance_record_guest_payment($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
    [options.key ?? randomUUID(), bookingId, kind, amount, options.currency ?? "USD", options.method ?? "cash", options.on ?? "2026-08-05",
      options.applied ?? null, null, null])).rows[0]);
}

async function issueCredit(bookingId: string, amount: number, options: { expires?: string | null; key?: string } = {}) {
  return asOwner(async () => (await db.query<Row>(
    "select * from public.finance_issue_credit_note($1, $2, $3, '2026-08-05', 'Weather cancellation goodwill', $4)",
    [options.key ?? randomUUID(), bookingId, amount, options.expires ?? null])).rows[0]);
}

async function redeem(creditNoteId: unknown, bookingId: string, amount: number, on = "2026-08-10") {
  return asOwner(async () => (await db.query<Row>(
    "select * from public.finance_redeem_credit_note($1, $2, $3, $4, $5)", [randomUUID(), creditNoteId, bookingId, amount, on])).rows[0]);
}

async function reverse(entryId: unknown, note = "Entered on the wrong booking") {
  return asOwner(async () => (await db.query<Row>("select * from public.finance_reverse_guest_payment($1, $2)", [entryId, note])).rows[0]);
}

async function summary(bookingId: string) {
  return (await db.query<Row>("select * from public.booking_payment_summary where booking_id = $1", [bookingId])).rows[0];
}

async function paymentStatus(bookingId: string) {
  return (await db.query<{ payment_status: string }>("select payment_status::text from public.bookings where id = $1", [bookingId])).rows[0].payment_status;
}

describe("deposits and balance payments", () => {
  it("moves from unpaid to deposit paid to paid, and keeps payment_status in step", async () => {
    const booking = await createBooking(db, { amount: 100, payment_status: "unpaid" });
    await pay(booking, "deposit", 30);
    let s = await summary(booking);
    expect([s.payment_state, n(s.received), n(s.outstanding)]).toEqual(["deposit_paid", "30.00", "70.00"]);
    expect(await paymentStatus(booking)).toBe("unpaid");

    await pay(booking, "balance", 70, { method: "card" });
    s = await summary(booking);
    expect([s.payment_state, n(s.net_paid), n(s.outstanding)]).toEqual(["paid", "100.00", "0.00"]);
    expect(await paymentStatus(booking)).toBe("paid");
  });

  it("stores the original currency, the booking-currency amount and the rate used", async () => {
    // EUR 80 booking paid EGP 5,000 cash: 5000 EGP = 100 USD = 80 EUR at the 2026-08-05 rates.
    const booking = await createBooking(db, { amount: 80, currency: "EUR", payment_status: "unpaid" });
    const entry = await pay(booking, "balance", 5000, { currency: "EGP" });
    expect([entry.currency, n(entry.amount), entry.booking_currency, n(entry.applied_amount), Number(entry.applied_rate), n(entry.amount_usd), entry.fx_locked])
      .toEqual(["EGP", "5000.00", "EUR", "80.00", 0.016, "100.00", true]);
    expect((await summary(booking)).payment_state).toBe("paid");
  });

  it("accepts the rate actually used at the desk instead of the daily rate", async () => {
    const booking = await createBooking(db, { amount: 80, currency: "EUR", payment_status: "unpaid" });
    const entry = await pay(booking, "deposit", 2000, { currency: "EGP", applied: 35 });
    expect([n(entry.applied_amount), Number(entry.applied_rate), n(entry.amount_usd)]).toEqual(["35.00", 0.0175, "40.00"]);
    await expect(pay(booking, "deposit", 20, { currency: "EUR", applied: 21 })).rejects.toThrow(/must equal/);
  });

  it("converts between two non-USD currencies through the USD rates of the payment date", async () => {
    // SAR 100 = USD 26.67 = EUR 21.33 (rates: 3.75 SAR and 0.8 EUR per USD).
    const booking = await createBooking(db, { amount: 80, currency: "EUR", payment_status: "unpaid" });
    const entry = await pay(booking, "deposit", 100, { currency: "SAR" });
    expect([n(entry.applied_amount), n(entry.amount_usd)]).toEqual(["21.33", "26.67"]);
  });

  it("returns the same entry when a phone double-submits, and rejects a reused key for another payment", async () => {
    const booking = await createBooking(db, { amount: 100, payment_status: "unpaid" });
    const key = randomUUID();
    const first = await pay(booking, "deposit", 30, { key });
    const again = await pay(booking, "deposit", 30, { key });
    expect(again.id).toBe(first.id);
    expect((await summary(booking)).received).toBe("30.00");
    await expect(pay(booking, "refund", 10, { key })).rejects.toThrow(/already used/);
  });
});

describe("refunds", () => {
  it("never refunds more than the guest paid", async () => {
    const booking = await createBooking(db, { amount: 100, payment_status: "paid" });
    // Marked paid, but no payment recorded yet: a refund must wait for the payment record.
    await expect(pay(booking, "refund", 10)).rejects.toThrow(/Record the original payment first/);
    await pay(booking, "balance", 100);
    await expect(pay(booking, "refund", 100.01)).rejects.toThrow(/cannot exceed/);
  });

  it("a partial refund on a completed trip reduces revenue by exactly the refund", async () => {
    const booking = await createBooking(db, { amount: 100, status: "completed", payment_status: "unpaid" });
    await pay(booking, "balance", 100);
    await pay(booking, "refund", 25, { method: "card" });
    const s = await summary(booking);
    expect([s.payment_state, n(s.refunded_cash), n(s.net_paid), n(s.outstanding)]).toEqual(["partly_refunded", "25.00", "75.00", "0.00"]);
    expect(await paymentStatus(booking)).toBe("paid");
    const [line] = await lines(db, booking);
    expect([n(line.refunded_amount), n(line.recognised_revenue), n(line.refund_usd), n(line.net_sales_usd)]).toEqual(["25.00", "75.00", "25.00", "75.00"]);
  });

  it("a full refund marks the booking refunded and removes its revenue", async () => {
    const booking = await createBooking(db, { amount: 100, payment_status: "unpaid" });
    await pay(booking, "balance", 100);
    await pay(booking, "refund", 100);
    expect((await summary(booking)).payment_state).toBe("refunded");
    expect(await paymentStatus(booking)).toBe("refunded");
    const [line] = await lines(db, booking);
    expect(n(line.recognised_revenue)).toBe("0.00");
  });

  it("spreads refunds over a multi-trip booking by net price, to the cent", async () => {
    const booking = await createBooking(db, {
      amount: 100, payment_status: "unpaid", tour_slug: "multi-trip", pricing_snapshot: { version: 1, currency: "USD", subtotal: 100, pending: false,
        trips: [1, 2, 3].map((index) => ({ name: `Trip ${index}`, date: "2026-08-01", guests: 1, participants: null, lines: [{ kind: "booking", quantity: 1, unitPrice: 1, total: 1 }] })) },
    });
    await pay(booking, "balance", 100);
    await pay(booking, "refund", 10);
    const rows = await lines(db, booking);
    expect(rows.map((row) => n(row.refunded_amount))).toEqual(["3.33", "3.33", "3.34"]);
    expect(rows.reduce((total, row) => total + Math.round(Number(row.recognised_revenue) * 100), 0)).toBe(9000);
  });

  it("reverses a payment only after the refunds that depend on it", async () => {
    const booking = await createBooking(db, { amount: 100, payment_status: "unpaid" });
    const payment = await pay(booking, "balance", 100);
    const refund = await pay(booking, "refund", 40);
    await expect(reverse(payment.id)).rejects.toThrow(/Reverse the refunds/);
    await reverse(refund.id);
    const reversal = await reverse(payment.id);
    expect([reversal.kind, n(reversal.amount), reversal.is_reversal]).toEqual(["balance", "-100.00", true]);
    expect((await summary(booking)).payment_state).toBe("unpaid");
    await expect(reverse(payment.id)).rejects.toThrow(/already been reversed/);
    await expect(reverse(reversal.id)).rejects.toThrow(/cannot itself be reversed/);
  });
});

describe("cancellations", () => {
  async function drsBookingWithPartner(amount = 100, cost = 60) {
    const supplier = await createSupplier(db, `Cancel Boat ${randomUUID().slice(0, 6)}`);
    const booking = await createBooking(db, { amount, payment_status: "unpaid", date: "2026-08-10" });
    await assignSupplier(db, booking, supplier, cost);
    const [line] = await lines(db, booking);
    await asOwner(() => db.query("select public.finance_update_line($1, '{\"collected_by\": \"daily_red_sea\"}')", [line.id]));
    return { supplier, booking };
  }

  it("keeps a non-refundable deposit as revenue and cancels what the partner is owed", async () => {
    const { supplier, booking } = await drsBookingWithPartner();
    await pay(booking, "deposit", 30);
    let balance = (await ledger(db, { supplierId: supplier })).reduce((total, entry) => total + Number(entry.amount), 0);
    expect(balance).toBe(-60);

    await db.query("update public.bookings set status = 'cancelled', cancellation_reason = 'weather' where id = $1", [booking]);
    const [line] = await lines(db, booking);
    expect([n(line.recognised_gross), n(line.recognised_refund), n(line.recognised_revenue), n(line.recognised_supplier_cost)])
      .toEqual(["30.00", "0.00", "30.00", "0.00"]);
    balance = (await ledger(db, { supplierId: supplier })).reduce((total, entry) => total + Number(entry.amount), 0);
    expect(balance).toBe(0);
    const s = await summary(booking);
    expect([n(s.outstanding), s.payment_state]).toEqual(["0.00", "deposit_paid"]);
  });

  it("charges the partner's cancellation fee when one is agreed", async () => {
    const { supplier, booking } = await drsBookingWithPartner();
    const [line] = await lines(db, booking);
    await asOwner(() => db.query("select public.finance_update_line($1, '{\"supplier_cancellation_fee\": 15}')", [line.id]));
    await db.query("update public.bookings set status = 'cancelled', cancellation_reason = 'guest' where id = $1", [booking]);
    const balance = (await ledger(db, { supplierId: supplier })).reduce((total, entry) => total + Number(entry.amount), 0);
    expect(balance).toBe(-15);
  });

  it("stamps the cancellation time and clears the reason if the booking is reinstated", async () => {
    const booking = await createBooking(db, { amount: 50 });
    await db.query("update public.bookings set status = 'cancelled', cancellation_reason = 'partner', cancellation_note = 'Boat engine failure' where id = $1", [booking]);
    let { rows: [row] } = await db.query<Row>("select cancelled_at, cancellation_reason::text from public.bookings where id = $1", [booking]);
    expect(row.cancelled_at).not.toBeNull();
    expect(row.cancellation_reason).toBe("partner");
    await db.query("update public.bookings set status = 'confirmed' where id = $1", [booking]);
    ({ rows: [row] } = await db.query<Row>("select cancelled_at, cancellation_reason, cancellation_note from public.bookings where id = $1", [booking]));
    expect(row).toEqual({ cancelled_at: null, cancellation_reason: null, cancellation_note: null });
  });

  it("reports the monthly cost of cancellations by reason", async () => {
    // Own month so other tests do not interfere: two weather cancellations in September.
    const kept = await createBooking(db, { amount: 200, payment_status: "unpaid", date: "2026-09-01" });
    await pay(kept, "deposit", 50, { on: "2026-09-01" });
    await db.query("update public.bookings set status = 'cancelled', cancellation_reason = 'weather' where id = $1", [kept]);
    const refunded = await createBooking(db, { amount: 80, currency: "EUR", payment_status: "unpaid", date: "2026-09-01" });
    await pay(refunded, "balance", 80, { currency: "EUR", on: "2026-09-01" });
    await pay(refunded, "refund", 80, { currency: "EUR", on: "2026-09-01" });
    await db.query("update public.bookings set status = 'cancelled', cancellation_reason = 'weather' where id = $1", [refunded]);

    const { rows } = await db.query<Row>("select * from public.finance_cancellation_impact where month = '2026-09-01' and reason = 'weather'");
    // Lost: USD 150 of the first (200 - 50 kept) + EUR 80 = USD 100 of the second.
    expect([rows[0].bookings, n(rows[0].lost_sales_usd), n(rows[0].retained_usd), n(rows[0].refunds_usd), n(rows[0].net_cost_usd)])
      .toEqual([2, "250.00", "50.00", "100.00", "-50.00"]);
  });
});

describe("credit notes", () => {
  it("issues a numbered credit note as a non-cash refund and redeems it on a later booking", async () => {
    const original = await createBooking(db, { amount: 120, payment_status: "unpaid" });
    await pay(original, "balance", 120);
    await db.query("update public.bookings set status = 'cancelled', cancellation_reason = 'weather' where id = $1", [original]);
    const note = await issueCredit(original, 120, { expires: "2027-10-05" });
    expect(String(note.number)).toMatch(/^CN-2026-\d{4}$/);
    expect([n(note.amount), n(note.remaining), note.status, note.currency]).toEqual(["120.00", "120.00", "open", "USD"]);
    const s = await summary(original);
    expect([n(s.refunded_cash), n(s.refunded_credit), s.payment_state]).toEqual(["0.00", "120.00", "refunded"]);
    const [line] = await lines(db, original);
    expect(n(line.recognised_revenue)).toBe("0.00");

    // Redeem EUR-free: next booking in EUR, credit note in USD (100 USD = 80 EUR).
    const next = await createBooking(db, { amount: 90, currency: "EUR", payment_status: "unpaid" });
    const redemption = await redeem(note.id, next, 100);
    expect([redemption.method, n(redemption.amount), redemption.currency, n(redemption.applied_amount)]).toEqual(["credit_note", "100.00", "USD", "80.00"]);
    const { rows: [balance] } = await db.query<Row>("select remaining, status from public.credit_note_balances where id = $1", [note.id]);
    expect([n(balance.remaining), balance.status]).toEqual(["20.00", "partly_used"]);
    expect((await summary(next)).payment_state).toBe("deposit_paid");
    await expect(redeem(note.id, next, 20.01)).rejects.toThrow(/only 20.00 USD left/);
  });

  it("cannot exceed what the guest paid, be used after expiry, or be voided once used", async () => {
    const booking = await createBooking(db, { amount: 60, payment_status: "unpaid" });
    await pay(booking, "balance", 60);
    await expect(issueCredit(booking, 61)).rejects.toThrow(/cannot exceed/);
    const note = await issueCredit(booking, 60, { expires: "2026-08-06" });
    const other = await createBooking(db, { amount: 60, payment_status: "unpaid" });
    await expect(redeem(note.id, other, 10, "2026-08-12")).rejects.toThrow(/expired/);
    const used = await redeem(note.id, other, 10, "2026-08-06");
    const { rows: [issue] } = await db.query<Row>("select id from public.guest_payments where credit_note_id = $1 and kind = 'credit_note_issued'", [note.id]);
    await expect(reverse(issue.id)).rejects.toThrow(/already been used/);
    await reverse(used.id);
    await reverse(issue.id, "Issued in error");
    const { rows: [after] } = await db.query<Row>("select status, void_reason from public.credit_note_balances where id = $1", [note.id]);
    expect(after).toEqual({ status: "void", void_reason: "Issued in error" });
    await expect(redeem(note.id, other, 5, "2026-08-06")).rejects.toThrow(/void/);
  });
});

describe("guest payment records are protected", () => {
  it("cannot be edited or deleted, and credit notes cannot be changed", async () => {
    const booking = await createBooking(db, { amount: 40, payment_status: "unpaid" });
    const entry = await pay(booking, "balance", 40);
    await expect(db.query("update public.guest_payments set amount = 1, applied_amount = 1 where id = $1", [entry.id])).rejects.toThrow(/append-only/);
    await expect(db.query("delete from public.guest_payments where id = $1", [entry.id])).rejects.toThrow(/append-only/);
    const note = await issueCredit(booking, 10);
    await expect(db.query("update public.credit_notes set amount = 99 where id = $1", [note.id])).rejects.toThrow(/cannot be changed/);
    await expect(db.query("delete from public.credit_notes where id = $1", [note.id])).rejects.toThrow(/never deleted/);
  });

  it("locks the USD value once the exact payment-date rate arrives", async () => {
    const booking = await createBooking(db, { amount: 100, currency: "GBP", payment_status: "unpaid" });
    const entry = await pay(booking, "deposit", 75, { currency: "GBP", on: "2026-08-20" });
    expect([n(entry.amount_usd), entry.fx_locked]).toEqual(["100.00", false]);
    await setRate(db, "2026-08-20", "GBP", 0.6);
    await db.query("select public.finance_refresh_unlocked_fx()");
    const { rows: [after] } = await db.query<Row>("select amount_usd, fx_locked from public.guest_payments where id = $1", [entry.id]);
    expect([n(after.amount_usd), after.fx_locked]).toEqual(["125.00", true]);
  });

  it("is limited to the owner and the accountant, and every entry is audited", async () => {
    const booking = await createBooking(db, { amount: 40, payment_status: "unpaid" });
    await actAs(db, await createStaff(db, "manager"));
    await expect(db.query("select public.finance_record_guest_payment($1, $2, 'deposit', 10, 'USD', 'cash', '2026-08-05')", [randomUUID(), booking]))
      .rejects.toThrow(/manage_finance/);
    const accountant = await createStaff(db, "finance");
    await actAs(db, accountant);
    const { rows: [entry] } = await db.query<Row>("select * from public.finance_record_guest_payment($1, $2, 'deposit', 10, 'USD', 'cash', '2026-08-05')", [randomUUID(), booking]);
    expect(entry.created_by_email).toBe(accountant.email);
    await actAs(db, system);
    const { rows } = await db.query<Row>("select actor_email from public.admin_audit_log where resource_type = 'guest_payments' and resource_id = $1", [entry.id]);
    expect(rows).toEqual([{ actor_email: accountant.email }]);
  });
});
