import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  actAs, assignSupplier, createBooking, createFinanceDatabase, createStaff, createSupplier, ledger, lines, n, owner, setRate, system,
  type FinanceDb,
} from "./support/finance-db";

let db: FinanceDb;

beforeAll(async () => {
  db = await createFinanceDatabase();
  // Rates are units per USD; a snapshot after the trip dates locks them.
  for (const date of ["2026-10-01", "2026-10-10", "2026-12-31"]) {
    await setRate(db, date, "EUR", 0.8);
    await setRate(db, date, "EGP", 50);
    await setRate(db, date, "SAR", 3.75);
    await setRate(db, date, "GBP", 0.75);
  }
}, 120_000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => { await actAs(db, system); });

const isoDate = (value: unknown) => (value instanceof Date ? value.toISOString().slice(0, 10) : value);

const updateLine = async (lineId: unknown, changes: Record<string, unknown>) => {
  await actAs(db, owner);
  const { rows } = await db.query<Record<string, unknown>>("select * from public.finance_update_line($1, $2)", [lineId, JSON.stringify(changes)]);
  await actAs(db, system);
  return rows[0];
};

describe("booking financials: creation and margin math", () => {
  it("creates one line per booking with supplier cost, agent commission, DRS commission and margin", async () => {
    const supplier = await createSupplier(db);
    await db.query("insert into public.supplier_prices(supplier_id, tour_slug, adult_cost, youth_cost, currency) values ($1, 'margin-reef', 30, 15, 'USD')", [supplier]);
    const booking = await createBooking(db, { amount: 110, subtotal: 120, tour_slug: "margin-reef", guests: 3, adults: 2, youth: 1, sales_commission_percent: 10 });
    await assignSupplier(db, booking, supplier);
    const [line] = await lines(db, booking);
    expect(line.outcome).toBe("active");
    expect(n(line.selling_price)).toBe("120.00");
    expect(n(line.discount_amount)).toBe("10.00");
    expect(n(line.net_selling_price)).toBe("110.00");
    expect(line.supplier_cost_source).toBe("supplier_price");
    expect(n(line.supplier_cost)).toBe("75.00"); // 2 x 30 + 1 x 15
    expect(n(line.agent_commission)).toBe("11.00");
    expect(n(line.drs_commission)).toBe("24.00"); // 110 - 75 - 11
    await updateLine(line.id, { payment_fees: 4 });
    const [updated] = await lines(db, booking);
    expect(n(updated.margin_amount)).toBe("20.00");
    expect(n(updated.margin_pct)).toBe("18.18"); // 20 / 110
    expect(n(updated.margin_amount_usd)).toBe("20.00");
  });

  it("prefers the assignment internal cost over supplier prices", async () => {
    const supplier = await createSupplier(db);
    await db.query("insert into public.supplier_prices(supplier_id, tour_slug, adult_cost, currency) values ($1, 'reef', 99, 'USD')", [supplier]);
    const booking = await createBooking(db, { amount: 100 });
    await assignSupplier(db, booking, supplier, 42);
    const [line] = await lines(db, booking);
    expect(line.supplier_cost_source).toBe("assignment");
    expect(n(line.supplier_cost)).toBe("42.00");
  });

  it("supports a percentage supplier cost from supplier prices and as a manual override", async () => {
    const supplier = await createSupplier(db);
    await db.query("insert into public.supplier_prices(supplier_id, tour_slug, adult_cost, cost_percent, currency) values ($1, 'pct-reef', 0, 70, 'USD')", [supplier]);
    const booking = await createBooking(db, { amount: 200, tour_slug: "pct-reef" });
    await assignSupplier(db, booking, supplier);
    let [line] = await lines(db, booking);
    expect(line.supplier_cost_source).toBe("supplier_percent");
    expect(n(line.supplier_cost)).toBe("140.00");
    line = await updateLine(line.id, { supplier_cost: { mode: "percent", percent: 62.5 } });
    expect(line.supplier_cost_source).toBe("manual_percent");
    expect(n(line.supplier_cost)).toBe("125.00");
    line = await updateLine(line.id, { supplier_cost: { mode: "amount", amount: 90, currency: "USD" } });
    expect(n(line.supplier_cost)).toBe("90.00");
    line = await updateLine(line.id, { supplier_cost: { mode: "auto" } });
    expect(line.supplier_cost_source).toBe("supplier_percent");
  });

  it("splits multi-trip bookings into one line per trip using the pricing snapshot", async () => {
    await db.query("insert into public.finance_tour_dimensions(tour_slug, tour_name, destination, product_line) values ('giftun', 'Giftun Island', 'hurghada', 'Island Trip'), ('safari', 'Desert Safari', 'hurghada', 'Desert Safari')");
    const booking = await createBooking(db, {
      amount: 270, subtotal: 300, tour_slug: "multi-trip", tour_name: "2 trips", date: "2026-10-01",
      pricing_snapshot: { version: 1, currency: "USD", subtotal: 300, pending: false, trips: [
        { name: "Giftun Island", date: "2026-10-01", guests: 2, participants: { adults: 2, youth: 0, infants: 0 }, lines: [{ kind: "adults", quantity: 2, unitPrice: 100, total: 200 }] },
        { name: "Desert Safari", date: "2026-10-10", guests: 2, participants: { adults: 2, youth: 0, infants: 0 }, lines: [{ kind: "adults", quantity: 2, unitPrice: 50, total: 100 }] },
      ] },
    });
    const rows = await lines(db, booking);
    expect(rows.map((row) => [row.tour_slug, isoDate(row.trip_date), n(row.selling_price), n(row.net_selling_price), row.destination, row.product_line])).toEqual([
      ["giftun", "2026-10-01", "200.00", "180.00", "hurghada", "Island Trip"],
      ["safari", "2026-10-10", "100.00", "90.00", "hurghada", "Desert Safari"],
    ]);
  });

  it("allocates rounding remainders to the last trip so lines always add up to the booking", async () => {
    const booking = await createBooking(db, {
      amount: 100, tour_slug: "multi-trip", pricing_snapshot: { version: 1, currency: "USD", subtotal: 100, pending: false, trips: [1, 2, 3].map((index) => ({
        name: `Trip ${index}`, date: "2026-10-01", guests: 1, participants: null, lines: [{ kind: "booking", quantity: 1, unitPrice: 1, total: 1 }] })) },
    });
    const rows = await lines(db, booking);
    expect(rows.map((row) => n(row.net_selling_price))).toEqual(["33.33", "33.33", "33.34"]);
  });

  it("records unsupported currencies as a sync error without blocking the booking", async () => {
    const booking = await createBooking(db, { amount: 10, currency: "AED" });
    expect(await lines(db, booking)).toEqual([]);
    const { rows } = await db.query<{ message: string }>("select message from public.finance_sync_errors where booking_id = $1", [booking]);
    expect(rows[0].message).toContain("unsupported currency AED");
  });
});

describe("USD conversion", () => {
  it("converts at the trip-date rate and stores the rate used", async () => {
    const booking = await createBooking(db, { amount: 100, currency: "EUR", date: "2026-10-10" });
    const [line] = await lines(db, booking);
    expect(n(line.fx_rate_to_usd)).toBe("1.25");
    expect(isoDate(line.fx_rate_date)).toBe("2026-10-10");
    expect(line.fx_locked).toBe(true);
    expect(n(line.net_sales_usd)).toBe("125.00");
  });

  it("uses the closest earlier rate provisionally until the exact date's rate is backfilled", async () => {
    const booking = await createBooking(db, { amount: 100, currency: "GBP", date: "2026-10-05" });
    let [line] = await lines(db, booking);
    expect([isoDate(line.fx_rate_date), line.fx_locked, n(line.net_sales_usd)]).toEqual(["2026-10-01", false, "133.33"]);
    await setRate(db, "2026-10-05", "GBP", 0.8);
    await db.query("select public.finance_refresh_unlocked_fx()");
    [line] = await lines(db, booking);
    expect([isoDate(line.fx_rate_date), line.fx_locked, n(line.net_sales_usd)]).toEqual(["2026-10-05", true, "125.00"]);
  });

  it("keeps a provisional rate for future trips and locks it once that date's rate exists", async () => {
    const booking = await createBooking(db, { amount: 1000, currency: "EGP", date: "2027-01-15" });
    let [line] = await lines(db, booking);
    expect(line.fx_locked).toBe(false);
    expect(n(line.net_sales_usd)).toBe("20.00");
    await setRate(db, "2027-01-15", "EGP", 40);
    await db.query("select public.finance_refresh_unlocked_fx()");
    [line] = await lines(db, booking);
    expect(line.fx_locked).toBe(true);
    expect(n(line.net_sales_usd)).toBe("25.00");
    await setRate(db, "2027-01-15", "EGP", 10);
    await db.query("select public.finance_refresh_unlocked_fx()");
    [line] = await lines(db, booking);
    expect(n(line.net_sales_usd)).toBe("25.00"); // locked: history never moves
  });

  it("converts cross-currency supplier costs into the booking currency for DRS commission", async () => {
    const supplier = await createSupplier(db);
    const booking = await createBooking(db, { amount: 100, currency: "EUR", date: "2026-10-10" });
    await assignSupplier(db, booking, supplier, 2500, "EGP");
    const [line] = await lines(db, booking);
    expect(n(line.supplier_cost_usd)).toBe("50.00"); // 2500 / 50
    expect(n(line.recognised_supplier_cost_booking_ccy)).toBe("40.00"); // $50 at 1.25 USD/EUR
    expect(n(line.drs_commission)).toBe("60.00");
    expect(n(line.drs_commission_usd)).toBe("75.00"); // 125 - 50
  });

  it("rounds half away from zero to the cent", async () => {
    const { rows } = await db.query<{ a: string; b: string }>("select public.finance_to_usd(0.125, 1) a, public.finance_to_usd(-0.125, 1) b");
    expect([n(rows[0].a), n(rows[0].b)]).toEqual(["0.13", "-0.13"]);
  });
});

describe("collected_by -> ledger rules", () => {
  it("defaults to supplier-collected: the supplier owes DRS net sales minus supplier cost", async () => {
    const supplier = await createSupplier(db);
    const booking = await createBooking(db, { amount: 100 });
    await assignSupplier(db, booking, supplier, 70);
    const [line] = await lines(db, booking);
    expect(line.collected_by).toBe("supplier");
    const entries = await ledger(db, { bookingId: booking });
    expect(entries.map((entry) => [entry.entry_type, n(entry.amount), entry.is_automatic])).toEqual([["commission_receivable", "30.00", true]]);
    expect(line.commission_received_status).toBe("unpaid");
    expect(line.supplier_cost_paid_status).toBe("paid");
  });

  it("switching to DRS-collected reverses the receivable and posts a supplier payable", async () => {
    const supplier = await createSupplier(db);
    const booking = await createBooking(db, { amount: 100 });
    await assignSupplier(db, booking, supplier, 70);
    const [line] = await lines(db, booking);
    await updateLine(line.id, { collected_by: "daily_red_sea", collection_status: "collected", collected_amount: 100 });
    const entries = await ledger(db, { bookingId: booking });
    expect(entries.map((entry) => [entry.entry_type, n(entry.amount)])).toEqual([
      ["commission_receivable", "30.00"], ["reversal", "-30.00"], ["supplier_cost_payable", "-70.00"],
    ]);
    expect(entries[1].reverses_entry_id).toBe(entries[0].id);
    const [after] = await lines(db, booking);
    expect(n(after.balance)).toBe("-70.00");
    expect(after.supplier_cost_paid_status).toBe("unpaid");
    expect(after.commission_received_status).toBe("not_applicable");
  });

  it("posts nothing while a booking is unconfirmed or has no supplier", async () => {
    const supplier = await createSupplier(db);
    const pending = await createBooking(db, { amount: 100, status: "new", payment_status: "unpaid" });
    await assignSupplier(db, pending, supplier, 50);
    expect(await ledger(db, { bookingId: pending })).toEqual([]);
    const unassigned = await createBooking(db, { amount: 100 });
    expect(await ledger(db, { bookingId: unassigned })).toEqual([]);
    await db.query("update public.bookings set status = 'confirmed' where id = $1", [pending]);
    expect((await ledger(db, { bookingId: pending })).map((entry) => n(entry.amount))).toEqual(["50.00"]);
  });

  it("is idempotent: unrelated booking updates do not create ledger noise", async () => {
    const supplier = await createSupplier(db);
    const booking = await createBooking(db, { amount: 100 });
    await assignSupplier(db, booking, supplier, 70);
    await db.query("update public.bookings set hotel = 'Synthetic Hotel', updated_at = now() where id = $1", [booking]);
    await db.query("update public.bookings set notes = 'x' where id = $1", [booking]);
    expect(await ledger(db, { bookingId: booking })).toHaveLength(1);
  });
});

describe("cancellations, refunds, no-shows and archiving", () => {
  async function confirmedDrsBooking(amount = 100, cost = 60) {
    const supplier = await createSupplier(db);
    const booking = await createBooking(db, { amount });
    await assignSupplier(db, booking, supplier, cost);
    const [line] = await lines(db, booking);
    await updateLine(line.id, { collected_by: "daily_red_sea" });
    return { supplier, booking, lineId: line.id };
  }

  it("cancelled + unpaid: no revenue, no cost, ledger reversed", async () => {
    const { booking } = await confirmedDrsBooking();
    await db.query("update public.bookings set status = 'cancelled', payment_status = 'unpaid' where id = $1", [booking]);
    const [line] = await lines(db, booking);
    expect([line.outcome, n(line.recognised_revenue), n(line.recognised_supplier_cost), n(line.margin_amount)]).toEqual(["cancelled", "0.00", "0.00", "0.00"]);
    expect(n(line.balance)).toBe("0.00");
  });

  it("cancelled with a supplier cancellation fee recognises only the fee", async () => {
    const { booking, lineId } = await confirmedDrsBooking();
    await db.query("update public.bookings set status = 'cancelled', payment_status = 'unpaid' where id = $1", [booking]);
    await updateLine(lineId, { supplier_cancellation_fee: 15 });
    const [line] = await lines(db, booking);
    expect([n(line.recognised_supplier_cost), n(line.margin_amount), n(line.balance)]).toEqual(["15.00", "-15.00", "-15.00"]);
  });

  it("cancelled but paid and not refunded: the retained payment is revenue", async () => {
    const { booking } = await confirmedDrsBooking();
    await db.query("update public.bookings set status = 'cancelled', payment_status = 'paid' where id = $1", [booking]);
    const [line] = await lines(db, booking);
    expect([n(line.recognised_revenue), n(line.recognised_supplier_cost), n(line.margin_amount)]).toEqual(["100.00", "0.00", "100.00"]);
  });

  it("full refund reverses revenue, supplier cost and agent commission; partial refund reduces revenue only", async () => {
    const { booking, lineId } = await confirmedDrsBooking();
    await db.query("update public.bookings set payment_status = 'refunded' where id = $1", [booking]);
    let [line] = await lines(db, booking);
    expect([n(line.refunded_amount), n(line.recognised_revenue), n(line.recognised_supplier_cost)]).toEqual(["100.00", "0.00", "0.00"]);
    await updateLine(lineId, { refunded_amount: 25 });
    [line] = await lines(db, booking);
    expect([n(line.recognised_gross), n(line.recognised_refund), n(line.recognised_revenue), n(line.recognised_supplier_cost), n(line.margin_amount)])
      .toEqual(["100.00", "25.00", "75.00", "60.00", "15.00"]);
    await expect(updateLine(lineId, { refunded_amount: 101 })).rejects.toThrow(/cannot exceed/);
  });

  it("no-show keeps revenue and supplier cost", async () => {
    const { booking, lineId } = await confirmedDrsBooking();
    await updateLine(lineId, { no_show: true });
    const [line] = await lines(db, booking);
    expect([line.outcome, n(line.recognised_revenue), n(line.recognised_supplier_cost)]).toEqual(["no_show", "100.00", "60.00"]);
    await db.query("update public.bookings set status = 'completed' where id = $1", [booking]);
    expect((await lines(db, booking))[0].outcome).toBe("no_show");
  });

  it("archived bookings drop out of finance unless a transaction was recorded", async () => {
    const plain = await confirmedDrsBooking();
    await db.query("update public.bookings set archived_at = now() where id = $1", [plain.booking]);
    let [line] = await lines(db, plain.booking);
    expect([line.included, line.excluded_reason, n(line.balance)]).toEqual([false, "archived", "0.00"]);

    const paid = await confirmedDrsBooking();
    await actAs(db, owner);
    await db.query("select public.finance_post_supplier_entry($1, 'payment_to_supplier', 60, 'USD', '2026-10-11', $2, 'Paid in cash')", [paid.supplier, paid.lineId]);
    await actAs(db, system);
    await db.query("update public.bookings set archived_at = now() where id = $1", [paid.booking]);
    [line] = await lines(db, paid.booking);
    expect([line.included, line.excluded_reason]).toEqual([true, null]);
  });

  it("blocks deleting a booking that has ledger history", async () => {
    const { booking } = await confirmedDrsBooking();
    await expect(db.query("delete from public.bookings where id = $1", [booking])).rejects.toThrow(/foreign key/);
  });
});

describe("supplier ledger: append-only, payments, settlements and balances", () => {
  it("rejects updates, deletes and truncation", async () => {
    const supplier = await createSupplier(db);
    const booking = await createBooking(db, { amount: 100 });
    await assignSupplier(db, booking, supplier, 70);
    const [entry] = await ledger(db, { bookingId: booking });
    await expect(db.query("update public.supplier_ledger set amount = 1 where id = $1", [entry.id])).rejects.toThrow(/append-only/);
    await expect(db.query("delete from public.supplier_ledger where id = $1", [entry.id])).rejects.toThrow(/append-only/);
    await expect(db.query("truncate public.supplier_ledger cascade")).rejects.toThrow(/append-only/);
  });

  it("tracks partial and full supplier payments with a running balance", async () => {
    const supplier = await createSupplier(db);
    const booking = await createBooking(db, { amount: 100 });
    await assignSupplier(db, booking, supplier, 70);
    let [line] = await lines(db, booking);
    await updateLine(line.id, { collected_by: "daily_red_sea" });
    await actAs(db, owner);
    await db.query("select public.finance_post_supplier_entry($1, 'payment_to_supplier', 30, 'USD', '2026-10-11', $2)", [supplier, line.id]);
    [line] = await lines(db, booking);
    expect([n(line.balance), line.supplier_cost_paid_status]).toEqual(["-40.00", "partial"]);
    await actAs(db, owner);
    await db.query("select public.finance_post_supplier_entry($1, 'payment_to_supplier', 40, 'USD', '2026-10-12', $2)", [supplier, line.id]);
    [line] = await lines(db, booking);
    expect([n(line.balance), line.supplier_cost_paid_status]).toEqual(["0.00", "paid"]);
    const { rows } = await db.query<{ balance: string }>("select balance from public.supplier_balances where supplier_id = $1", [supplier]);
    expect(n(rows[0].balance)).toBe("0.00");
  });

  it("records commission received from a supplier", async () => {
    const supplier = await createSupplier(db);
    const booking = await createBooking(db, { amount: 100 });
    await assignSupplier(db, booking, supplier, 70);
    let [line] = await lines(db, booking);
    await actAs(db, owner);
    await db.query("select public.finance_post_supplier_entry($1, 'commission_received_from_supplier', 30, 'USD', '2026-10-11', $2)", [supplier, line.id]);
    [line] = await lines(db, booking);
    expect([n(line.balance), line.commission_received_status]).toEqual(["0.00", "paid"]);
  });

  it("nets several bookings into one settlement and reports the net per currency", async () => {
    const supplier = await createSupplier(db);
    const owesUs = await createBooking(db, { amount: 100 });
    await assignSupplier(db, owesUs, supplier, 70); // supplier collected: +30
    const weOwe = await createBooking(db, { amount: 100 });
    await assignSupplier(db, weOwe, supplier, 80);
    const [weOweLine] = await lines(db, weOwe);
    await updateLine(weOweLine.id, { collected_by: "daily_red_sea" }); // -80
    const [owesUsLine] = await lines(db, owesUs);
    await actAs(db, owner);
    const { rows } = await db.query<{ result: { entries: number; net_by_currency: Record<string, number> } }>(
      "select public.finance_post_net_settlement(gen_random_uuid(), $1, $2::uuid[], '2026-10-20', 'Weekly settlement') result", [supplier, [owesUsLine.id, weOweLine.id]]);
    expect(rows[0].result.entries).toBe(2);
    expect(Number(rows[0].result.net_by_currency.USD)).toBe(50); // DRS pays the supplier 80 - 30
    const balances = await db.query<{ balance: string }>("select balance from public.supplier_balances where supplier_id = $1", [supplier]);
    expect(n(balances.rows[0].balance)).toBe("0.00");
    await expect(db.query("select public.finance_post_net_settlement(gen_random_uuid(), $1, $2::uuid[], '2026-10-21')", [supplier, [owesUsLine.id]])).rejects.toThrow(/already settled/);
  });

  it("corrects manual entries only by reversal, once, and never reverses a reversal", async () => {
    const supplier = await createSupplier(db);
    await actAs(db, owner);
    const { rows } = await db.query<{ id: string }>("select id from public.finance_post_supplier_entry($1, 'adjustment', -12.5, 'EGP', '2026-10-01', null, 'Opening balance')", [supplier]);
    const reversal = await db.query<{ id: string; amount: string }>("select id, amount from public.finance_reverse_supplier_entry($1, 'Entered twice')", [rows[0].id]);
    expect(n(reversal.rows[0].amount)).toBe("12.50");
    await expect(db.query("select public.finance_reverse_supplier_entry($1, 'again')", [rows[0].id])).rejects.toThrow(/already been reversed/);
    await expect(db.query("select public.finance_reverse_supplier_entry($1, 'again')", [reversal.rows[0].id])).rejects.toThrow(/cannot itself be reversed/);
  });

  it("validates manual entries: positive amounts, notes on adjustments, the line's currency and supplier", async () => {
    const supplier = await createSupplier(db);
    const other = await createSupplier(db);
    const booking = await createBooking(db, { amount: 100, currency: "EUR" });
    await assignSupplier(db, booking, supplier, 70, "EUR");
    const [line] = await lines(db, booking);
    await actAs(db, owner);
    await expect(db.query("select public.finance_post_supplier_entry($1, 'payment_to_supplier', -5, 'EUR', '2026-10-01')", [supplier])).rejects.toThrow(/positive amount/);
    await expect(db.query("select public.finance_post_supplier_entry($1, 'adjustment', 5, 'EUR', '2026-10-01', null, '')", [supplier])).rejects.toThrow();
    await expect(db.query("select public.finance_post_supplier_entry($1, 'commission_received_from_supplier', 5, 'USD', '2026-10-01', $2)", [supplier, line.id])).rejects.toThrow(/must be in EUR/);
    await expect(db.query("select public.finance_post_supplier_entry($1, 'commission_received_from_supplier', 5, 'EUR', '2026-10-01', $2)", [other, line.id])).rejects.toThrow(/does not belong/);
    await expect(db.query("select public.finance_post_supplier_entry($1, 'supplier_cost_payable', 5, 'EUR', '2026-10-01')", [supplier])).rejects.toThrow(/cannot be posted manually/);
    await expect(db.query("select public.finance_post_supplier_entry($1, 'payment_to_supplier', 5, 'AED', '2026-10-01')", [supplier])).rejects.toThrow();
  });

  it("stores USD at the entry date for manual entries", async () => {
    const supplier = await createSupplier(db);
    await actAs(db, owner);
    const { rows } = await db.query<{ amount_usd: string; fx_rate_to_usd: string }>("select amount_usd, fx_rate_to_usd from public.finance_post_supplier_entry($1, 'payment_to_supplier', 500, 'EGP', '2026-10-15')", [supplier]);
    expect([n(rows[0].amount_usd), n(rows[0].fx_rate_to_usd)]).toEqual(["10.00", "0.02"]);
  });
});

describe("expenses", () => {
  it("converts at the invoice date, can be voided with a reason and is then frozen", async () => {
    const { rows } = await db.query<{ id: string; amount_usd: string; fx_locked: boolean }>(
      "insert into public.expenses(description, amount, currency, expense_date, vendor, invoice_number) values ('Hosting', 500, 'EGP', '2026-10-10', 'Vercel Inc.', 'INV-001') returning id, amount_usd, fx_locked");
    expect([n(rows[0].amount_usd), rows[0].fx_locked]).toEqual(["10.00", true]);
    await actAs(db, owner);
    await expect(db.query("select public.finance_void_expense($1, '')", [rows[0].id])).rejects.toThrow(/reason/);
    await db.query("select public.finance_void_expense($1, 'Duplicate of bank import')", [rows[0].id]);
    await actAs(db, system);
    await expect(db.query("update public.expenses set amount = 1 where id = $1", [rows[0].id])).rejects.toThrow(/voided/);
  });

  it("blocks a second expense with the same normalized vendor and invoice number", async () => {
    await db.query("insert into public.expenses(description, amount, currency, expense_date, vendor, invoice_number) values ('A', 1, 'USD', '2026-10-01', 'Acme Boats LLC', 'inv 77')");
    await expect(db.query("insert into public.expenses(description, amount, currency, expense_date, vendor, invoice_number) values ('B', 2, 'USD', '2026-10-02', 'ACME boats, llc', 'INV-77')")).rejects.toThrow(/expenses_vendor_invoice_unique/);
  });

  it("only accepts supported currencies", async () => {
    await expect(db.query("insert into public.expenses(description, amount, currency) values ('X', 1, 'AED')")).rejects.toThrow();
  });
});

describe("permissions, RLS and audit", () => {
  it("lets owner, manager and finance manage finance, and nobody else", async () => {
    const booking = await createBooking(db, { amount: 50 });
    const [line] = await lines(db, booking);
    for (const role of ["manager", "finance"]) {
      await actAs(db, await createStaff(db, role));
      await db.query("select public.finance_update_line($1, '{\"payment_fees\": 1}')", [line.id]);
    }
    for (const role of ["sales", "operations", "content_editor"]) {
      await actAs(db, await createStaff(db, role));
      await expect(db.query("select public.finance_update_line($1, '{\"payment_fees\": 2}')", [line.id])).rejects.toThrow(/manage_finance/);
    }
  });

  it("hides finance rows from staff without view_finance under RLS", async () => {
    const supplier = await createSupplier(db);
    const booking = await createBooking(db, { amount: 100 });
    await assignSupplier(db, booking, supplier, 70);
    const sales = await createStaff(db, "sales");
    const finance = await createStaff(db, "finance");
    const visible = async (user: { uid: string; email: string }) => {
      await actAs(db, user);
      await db.exec("set role authenticated");
      try {
        const { rows } = await db.query<{ count: number }>("select count(*)::int count from public.supplier_ledger where booking_id = $1", [booking]);
        return rows[0].count;
      } finally { await db.exec("reset role"); }
    };
    expect(await visible(sales)).toBe(0);
    expect(await visible(finance)).toBe(1);
  });

  it("rejects unknown fields in line updates", async () => {
    const booking = await createBooking(db, { amount: 50 });
    const [line] = await lines(db, booking);
    await expect(updateLine(line.id, { selling_price: 1 })).rejects.toThrow(/Unknown field/);
  });

  it("writes an audit record for finance mutations", async () => {
    const booking = await createBooking(db, { amount: 60 });
    const [line] = await lines(db, booking);
    await updateLine(line.id, { payment_fees: 3 });
    const { rows } = await db.query<{ actor_email: string; action: string }>(
      "select actor_email, action from public.admin_audit_log where resource_type = 'booking_financial_lines' and resource_id = $1 order by id", [line.id]);
    expect(rows[0]).toEqual({ actor_email: "system", action: "insert" });
    expect(rows.some((row) => row.actor_email === "info@dailyredsea.com" && row.action === "update")).toBe(true);
  });
});

describe("review regressions: FX on automatic ledger entries", () => {
  const usdTotal = async (bookingId: string) => {
    const { rows } = await db.query<{ total: string | null; pending: number }>(
      "select sum(amount_usd) total, count(*) filter (where amount_usd is null)::int pending from public.supplier_ledger where booking_id = $1", [bookingId]);
    return rows[0];
  };

  it("posts USD-pending while the trip-date rate is provisional, then reverses and reposts at the locked rate", async () => {
    const supplier = await createSupplier(db);
    const booking = await createBooking(db, { amount: 100, currency: "EUR", date: "2026-10-03" });
    await assignSupplier(db, booking, supplier, 60, "EUR");
    let [line] = await lines(db, booking);
    expect(line.ledger_state).toBe("usd_pending");
    let entries = await ledger(db, { bookingId: booking });
    expect(entries.map((entry) => [entry.entry_type, n(entry.amount), entry.amount_usd])).toEqual([["commission_receivable", "40.00", null]]);

    await setRate(db, "2026-10-03", "EUR", 1);
    await db.query("select public.finance_refresh_unlocked_fx()");
    [line] = await lines(db, booking);
    entries = await ledger(db, { bookingId: booking });
    expect(entries.map((entry) => [entry.entry_type, n(entry.amount), n(entry.amount_usd)])).toEqual([
      ["commission_receivable", "40.00", null], ["reversal", "-40.00", null], ["commission_receivable", "40.00", "40.00"],
    ]);
    expect(entries[1].note).toContain("FX rate updated");
    expect([line.ledger_state, n(line.balance)]).toEqual(["posted", "40.00"]);
    expect(n((await usdTotal(booking)).total)).toBe(n(Number(line.drs_commission_usd) + Number(line.agent_commission_usd)));

    // A later admin override for that date never moves a locked line or its ledger entry.
    await setRate(db, "2026-10-03", "EUR", 2);
    await db.query("select public.finance_refresh_unlocked_fx()");
    expect(await ledger(db, { bookingId: booking })).toHaveLength(3);
  });

  it("keeps a DRS-collected payable's USD equal to the line's supplier cost in USD", async () => {
    const supplier = await createSupplier(db);
    const booking = await createBooking(db, { amount: 100, date: "2026-10-04" });
    await assignSupplier(db, booking, supplier, 3000, "EGP");
    const [line] = await lines(db, booking);
    await updateLine(line.id, { collected_by: "daily_red_sea" });
    expect(n((await usdTotal(booking)).total)).toBe(null);
    await setRate(db, "2026-10-04", "EGP", 48);
    await db.query("select public.finance_refresh_unlocked_fx()");
    const [after] = await lines(db, booking);
    expect(n(after.supplier_cost_usd)).toBe("62.50");
    expect(n((await usdTotal(booking)).total)).toBe("-62.50");
    expect([n(after.balance), after.ledger_state]).toEqual(["-3000.00", "posted"]);
  });

  it("waits for locked rates before posting a cross-currency receivable, and reverses an existing entry meanwhile", async () => {
    const supplier = await createSupplier(db);
    const booking = await createBooking(db, { amount: 100, currency: "EUR", date: "2026-11-15" });
    await assignSupplier(db, booking, supplier, 2000, "EGP");
    let [line] = await lines(db, booking);
    expect(line.ledger_state).toBe("awaiting_fx");
    expect(await ledger(db, { bookingId: booking })).toEqual([]);

    await updateLine(line.id, { collected_by: "daily_red_sea" });
    expect((await ledger(db, { bookingId: booking })).map((entry) => [entry.entry_type, n(entry.amount), entry.currency])).toEqual([["supplier_cost_payable", "-2000.00", "EGP"]]);
    await updateLine(line.id, { collected_by: "supplier" });
    expect((await ledger(db, { bookingId: booking })).map((entry) => entry.entry_type)).toEqual(["supplier_cost_payable", "reversal"]);
    [line] = await lines(db, booking);
    expect([line.ledger_state, n(line.balance)]).toEqual(["awaiting_fx", "0.00"]);

    await setRate(db, "2026-11-15", "EUR", 0.8);
    await setRate(db, "2026-11-15", "EGP", 50);
    await db.query("select public.finance_refresh_unlocked_fx()");
    [line] = await lines(db, booking);
    const last = (await ledger(db, { bookingId: booking })).at(-1)!;
    // 100 EUR sales (125 USD) - 2000 EGP cost (40 USD = 32 EUR)
    expect([last.entry_type, n(last.amount), last.currency, n(last.amount_usd)]).toEqual(["commission_receivable", "68.00", "EUR", "85.00"]);
    expect(line.ledger_state).toBe("posted");
  });
});

describe("review regressions: balances scoped by supplier and currency", () => {
  it("keeps a replaced supplier's payment history with that supplier and can settle it", async () => {
    const first = await createSupplier(db, "First");
    const second = await createSupplier(db, "Second");
    const booking = await createBooking(db, { amount: 100 });
    await assignSupplier(db, booking, first, 60);
    const [line] = await lines(db, booking);
    await updateLine(line.id, { collected_by: "daily_red_sea" });
    await actAs(db, owner);
    await db.query("select public.finance_post_supplier_entry($1, 'payment_to_supplier', 60, 'USD', '2026-10-10', $2)", [first, line.id]);
    await updateLine(line.id, { supplier_id: second, supplier_cost: { mode: "amount", amount: 60, currency: "USD" } });

    const [updated] = await lines(db, booking);
    expect([n(updated.balance), updated.supplier_cost_paid_status]).toEqual(["-60.00", "unpaid"]);
    const balances = await db.query<{ supplier_id: string; balance: string }>(
      "select supplier_id, balance from public.supplier_line_balances where line_id = $1 order by balance", [line.id]);
    expect(balances.rows.map((row) => [row.supplier_id, n(row.balance)])).toEqual([[second, "-60.00"], [first, "60.00"]]);

    // The first supplier now owes the prepayment back; settle it against the same line.
    await actAs(db, owner);
    const settled = await db.query<{ result: { net_by_currency: Record<string, number> } }>(
      "select public.finance_post_net_settlement(gen_random_uuid(), $1, $2::uuid[], '2026-10-12', 'Refund of prepayment') result", [first, [line.id]]);
    expect(Number(settled.rows[0].result.net_by_currency.USD)).toBe(-60);
    const after = await db.query<{ balance: string }>("select balance from public.supplier_balances where supplier_id = $1", [first]);
    expect(n(after.rows[0].balance)).toBe("0.00");
    expect(n((await lines(db, booking))[0].balance)).toBe("-60.00");
  });

  it("only lets a former supplier post against a line in a currency it has history in", async () => {
    const first = await createSupplier(db);
    const second = await createSupplier(db);
    const booking = await createBooking(db, { amount: 100 });
    await assignSupplier(db, booking, first, 60);
    const [line] = await lines(db, booking);
    await updateLine(line.id, { supplier_id: second });
    await actAs(db, owner);
    await db.query("select public.finance_post_supplier_entry($1, 'commission_received_from_supplier', 5, 'USD', '2026-10-10', $2)", [first, line.id]);
    await expect(db.query("select public.finance_post_supplier_entry($1, 'commission_received_from_supplier', 5, 'EUR', '2026-10-10', $2)", [first, line.id]))
      .rejects.toThrow(/no EUR history/);
  });

  it("scopes line status to the current ledger currency after collected_by changes currency", async () => {
    const supplier = await createSupplier(db);
    const booking = await createBooking(db, { amount: 100, currency: "EUR", date: "2026-10-10" });
    await assignSupplier(db, booking, supplier, 2000, "EGP");
    const [line] = await lines(db, booking);
    await actAs(db, owner);
    await db.query("select public.finance_post_supplier_entry($1, 'commission_received_from_supplier', 60, 'EUR', '2026-10-11', $2)", [supplier, line.id]);
    await updateLine(line.id, { collected_by: "daily_red_sea" });
    const [after] = await lines(db, booking);
    expect([after.ledger_currency, n(after.balance), after.supplier_cost_paid_status]).toEqual(["EGP", "-2000.00", "unpaid"]);
    const { rows } = await db.query<{ currency: string; balance: string }>(
      "select currency, balance from public.supplier_line_balances where line_id = $1 order by currency", [line.id]);
    expect(rows.map((row) => [row.currency, n(row.balance)])).toEqual([["EUR", "-60.00"], ["EGP", "-2000.00"]]);
  });
});

describe("review regressions: idempotent net settlements", () => {
  it("replays the same key without posting twice and rejects reusing a key for other input", async () => {
    const supplier = await createSupplier(db);
    const one = await createBooking(db, { amount: 100 });
    await assignSupplier(db, one, supplier, 70);
    const two = await createBooking(db, { amount: 100 });
    await assignSupplier(db, two, supplier, 50);
    const [lineOne] = await lines(db, one);
    const [lineTwo] = await lines(db, two);
    await actAs(db, owner);
    const key = "0b6e7c1a-2f3d-4a5b-8c9d-0e1f2a3b4c5d";
    const post = (ids: unknown[]) => db.query<{ result: Record<string, unknown> }>(
      "select public.finance_post_net_settlement($1, $2, $3::uuid[], '2026-10-20') result", [key, supplier, ids]);
    const first = (await post([lineOne.id, lineTwo.id])).rows[0].result;
    const replay = (await post([lineTwo.id, lineOne.id])).rows[0].result;
    expect(replay).toEqual({ ...first, replayed: true });
    const settlements = await db.query<{ count: number }>("select count(*)::int count from public.supplier_ledger where settlement_id = $1", [key]);
    expect(settlements.rows[0].count).toBe(2);
    await expect(post([lineOne.id])).rejects.toThrow(/already used for a different settlement/);
    await expect(db.query("delete from public.finance_settlements where id = $1", [key])).rejects.toThrow(/append-only/);
  });

  it("locks the selected lines before reading balances", async () => {
    const { rows } = await db.query<{ source: string }>("select prosrc source from pg_proc where proname = 'finance_post_net_settlement'");
    const source = rows[0].source;
    expect(source.indexOf("for update")).toBeGreaterThan(-1);
    expect(source.indexOf("for update")).toBeLessThan(source.indexOf("supplier_line_balances b"));
    expect(source).toContain("pg_advisory_xact_lock");
  });
});
