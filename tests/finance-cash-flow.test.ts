import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  actAs, assignSupplier, createBooking, createFinanceDatabase, createSupplier, lines, n, owner, setRate, system, type FinanceDb,
} from "./support/finance-db";

let db: FinanceDb;
type Row = Record<string, unknown>;

/**
 * One month (May 2026) with every kind of money event:
 *   guest pays USD 150 cash, then gets USD 30 back                   in 150, out 30
 *   guest's second booking: USD 50 credit note issued, then redeemed  no cash
 *   DRS pays the boat EGP 2,000 (USD 40)                              out 40
 *   supplier-collected trip: partner hands over USD 25 commission     in 25
 *   adjustment on a partner                                           no cash
 *   expense EGP 500 (USD 10); a voided expense EGP 1,000              out 10; voided = no cash
 */
beforeAll(async () => {
  db = await createFinanceDatabase();
  for (const date of ["2026-05-05", "2026-05-10", "2026-05-20"]) {
    await setRate(db, date, "EGP", 50);
    await setRate(db, date, "EUR", 0.8);
  }
  await actAs(db, system);
  const boat = await createSupplier(db, "Cash Boat");
  const paid = await createBooking(db, { amount: 150, date: "2026-05-10", payment_status: "unpaid" });
  await assignSupplier(db, paid, boat, 2000, "EGP");
  const [paidLine] = await lines(db, paid);
  const credited = await createBooking(db, { amount: 50, date: "2026-05-10", payment_status: "unpaid", status: "cancelled" });
  const nextTrip = await createBooking(db, { amount: 80, date: "2026-05-20", payment_status: "unpaid" });
  const agent = await createSupplier(db, "Cash Agent");
  const collected = await createBooking(db, { amount: 100, date: "2026-05-10" });
  await assignSupplier(db, collected, agent, 75);

  await actAs(db, owner);
  const pay = (booking: string, kind: string, amount: number, on = "2026-05-05") =>
    db.query("select public.finance_record_guest_payment($1, $2, $3, $4, 'USD', 'cash', $5)", [randomUUID(), booking, kind, amount, on]);
  await db.query("select public.finance_update_line($1, '{\"collected_by\": \"daily_red_sea\"}')", [paidLine.id]);
  await pay(paid, "balance", 150);
  await pay(paid, "refund", 30, "2026-05-10");
  await pay(credited, "balance", 50);
  const { rows: [note] } = await db.query<Row>("select * from public.finance_issue_credit_note($1, $2, 50, '2026-05-10', 'Weather', null)", [randomUUID(), credited]);
  await db.query("select public.finance_redeem_credit_note($1, $2, $3, 50, '2026-05-20')", [randomUUID(), note.id, nextTrip]);
  await db.query("select public.finance_post_supplier_entry($1, 'payment_to_supplier', 2000, 'EGP', '2026-05-10', $2, 'Paid on the pier')", [boat, paidLine.id]);
  const [collectedLine] = await lines(db, collected);
  await db.query("select public.finance_post_supplier_entry($1, 'commission_received_from_supplier', 25, 'USD', '2026-05-20', $2, 'Cash handed over')", [agent, collectedLine.id]);
  await db.query("select public.finance_post_supplier_entry($1, 'adjustment', 5, 'USD', '2026-05-20', null, 'Rounding agreed by phone')", [agent]);
  await actAs(db, system);
  await db.query("insert into public.expenses(description, amount, currency, expense_date) values ('Fuel', 500, 'EGP', '2026-05-10')");
  const { rows: [voided] } = await db.query<Row>("insert into public.expenses(description, amount, currency, expense_date) values ('Duplicate', 1000, 'EGP', '2026-05-10') returning id");
  await actAs(db, owner);
  await db.query("select public.finance_void_expense($1, 'Entered twice')", [voided.id]);
  await actAs(db, system);
}, 120_000);
afterAll(async () => { await db?.close(); });

describe("cash in vs cash out", () => {
  it("counts only real money movements, in USD", async () => {
    // Guest cash that was not given back as a credit note: 150 + 50 in, 30 out.
    const { rows: [may] } = await db.query<Row>("select * from public.finance_cash_flow where month = '2026-05-01'");
    expect([n(may.cash_in_usd), n(may.cash_out_usd), n(may.net_cash_usd)]).toEqual(["225.00", "80.00", "145.00"]);
    expect([n(may.guests_net_usd), n(may.partners_net_usd), n(may.expenses_net_usd), Number(may.usd_pending)]).toEqual(["170.00", "-15.00", "-10.00", 0]);
  });

  it("nets out a reversed partner payment", async () => {
    const { rows: [payment] } = await db.query<Row>("select id from public.supplier_ledger where entry_type = 'payment_to_supplier'");
    await actAs(db, owner);
    await db.query("select public.finance_reverse_supplier_entry($1, 'Paid the wrong boat')", [payment.id]);
    await actAs(db, system);
    const { rows: [may] } = await db.query<Row>("select partners_net_usd from public.finance_cash_flow where month = '2026-05-01'");
    // The reversal is dated today, so May keeps -40 + 25; today's month gets the +40 back.
    expect(n(may.partners_net_usd)).toBe("-15.00");
    const { rows } = await db.query<Row>("select sum(partners_net_usd)::text as total from public.finance_cash_flow");
    expect(n(rows[0].total)).toBe("25.00");
  });
});

describe("transaction list for the accountant", () => {
  it("lists every trip sale, guest payment, partner entry and expense with its original currency and USD", async () => {
    const { rows } = await db.query<Row>("select kind, count(*)::int as count from public.finance_transactions group by kind order by kind");
    const counts = Object.fromEntries(rows.map((row) => [row.kind, row.count]));
    expect(counts).toMatchObject({
      trip_sale: 4, guest_balance: 2, guest_refund: 1, guest_credit_note_issued: 1, guest_credit_redemption: 1,
      partner_payment_to_supplier: 1, partner_commission_received_from_supplier: 1, partner_adjustment: 1, expense: 2,
    });
    const { rows: [fuel] } = await db.query<Row>("select currency, amount, amount_usd, cash_effect_usd, is_cash from public.finance_transactions where description like 'Fuel%'");
    expect([fuel.currency, n(fuel.amount), n(fuel.amount_usd), n(fuel.cash_effect_usd), fuel.is_cash]).toEqual(["EGP", "500.00", "10.00", "-10.00", true]);
    const { rows: [voided] } = await db.query<Row>("select voided, is_cash, cash_effect_usd, description from public.finance_transactions where description like 'Duplicate%'");
    expect([voided.voided, voided.is_cash, voided.cash_effect_usd]).toEqual([true, false, null]);
    expect(String(voided.description)).toContain("VOIDED: Entered twice");
    const { rows: credit } = await db.query<Row>("select is_cash from public.finance_transactions where method = 'credit_note'");
    expect(credit.every((row) => row.is_cash === false)).toBe(true);
  });
});
