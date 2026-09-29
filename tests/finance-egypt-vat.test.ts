import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  actAs, assignSupplier, createBooking, createFinanceDatabase, createStaff, createSupplier, ledger, lines, n, owner, system, type FinanceDb,
} from "./support/finance-db";

let db: FinanceDb;
type Row = Record<string, unknown>;

beforeAll(async () => {
  db = await createFinanceDatabase();
  await db.query("insert into public.finance_tour_dimensions(tour_slug, tour_name, destination, product_line) values ('jeddah-reef', 'Jeddah Reef', 'jeddah', 'sea'), ('giftun', 'Giftun', 'hurghada', 'sea')");
}, 120_000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => { await actAs(db, system); });

async function asOwner<T>(work: () => Promise<T>) {
  await actAs(db, owner);
  try { return await work(); } finally { await actAs(db, system); }
}
const partner = async (name: string, status: string) => {
  const id = await createSupplier(db, name);
  await db.query("update public.suppliers set vat_status = $1 where id = $2", [status, id]);
  return id;
};
const collectedByUs = (lineId: unknown) => asOwner(() => db.query("select public.finance_update_line($1, '{\"collected_by\": \"daily_red_sea\"}')", [lineId]));
const pay = (booking: string, amount: number, on: string, kind = "deposit") =>
  asOwner(() => db.query("select public.finance_record_guest_payment($1, $2, $3, $4, 'USD', 'cash', $5)", [randomUUID(), booking, kind, amount, on]));

describe("Egypt VAT set up by the migration", () => {
  it("has Egypt 14% as the default from 1 October 2026 and Saudi 15% not applied by default", async () => {
    const { rows } = await db.query<Row>("select code, rate_percent, country, default_for_sales, default_for_purchases, effective_from::text from public.tax_rates order by code");
    expect(rows.map((row) => [row.code, Number(row.rate_percent), row.country, row.default_for_sales, row.default_for_purchases, row.effective_from])).toEqual([
      ["EG-VAT-14", 14, "EG", true, true, "2026-10-01"],
      ["SA-VAT-15", 15, "SA", false, false, "2026-10-01"],
    ]);
  });

  it("charges 14% (VAT-inclusive) on Egyptian trips from October, none before, none in Jeddah", async () => {
    const october = await createBooking(db, { amount: 114, date: "2026-10-20", tour_slug: "giftun" });
    const september = await createBooking(db, { amount: 114, date: "2026-09-20", tour_slug: "giftun" });
    const jeddah = await createBooking(db, { amount: 115, date: "2026-10-20", tour_slug: "jeddah-reef" });
    const [oct] = await lines(db, october);
    expect([n(oct.sales_tax_amount), n(oct.net_sales_usd), n(oct.revenue_ex_vat_usd), n(oct.margin_ex_vat_usd)]).toEqual(["14.00", "114.00", "100.00", "100.00"]);
    const [sep] = await lines(db, september);
    expect([sep.sales_tax_rate_id, n(sep.revenue_ex_vat_usd)]).toEqual([null, "114.00"]);
    const [jed] = await lines(db, jeddah);
    expect([jed.sales_tax_rate_id, n(jed.revenue_ex_vat_usd)]).toEqual([null, "115.00"]);
  });

  it("charges VAT on expenses from October by default", async () => {
    const { rows: [expense] } = await db.query<Row>("insert into public.expenses(description, amount, currency, expense_date) values ('Office rent', 1140, 'USD', '2026-10-05') returning tax_amount");
    expect(n(expense.tax_amount)).toBe("140.00");
  });
});

describe("partner VAT status", () => {
  it("records no VAT for partners who are not registered", async () => {
    const boat = await partner("Small Boat", "not_registered");
    const booking = await createBooking(db, { amount: 114, date: "2026-10-21", tour_slug: "giftun" });
    await assignSupplier(db, booking, boat, 57);
    const [line] = await lines(db, booking);
    expect([line.purchase_tax_rate_id, n(line.purchase_tax_amount), n(line.partner_cost_ex_vat_usd), n(line.margin_ex_vat_usd)]).toEqual([null, "0.00", "57.00", "43.00"]);
  });

  it("takes deductible VAT out of a registered partner's VAT-inclusive price", async () => {
    const hotel = await partner("Registered Hotel", "included");
    const booking = await createBooking(db, { amount: 114, date: "2026-10-21", tour_slug: "giftun" });
    await assignSupplier(db, booking, hotel, 57);
    const [line] = await lines(db, booking);
    await collectedByUs(line.id);
    const [after] = await lines(db, booking);
    expect([after.purchase_tax_mode, n(after.purchase_tax_amount), n(after.partner_cost_ex_vat_usd), n(after.margin_ex_vat_usd)]).toEqual(["included", "7.00", "50.00", "50.00"]);
    const entries = await ledger(db, { bookingId: booking });
    expect(entries.filter((entry) => entry.entry_type === "supplier_cost_payable").map((entry) => n(entry.amount))).toEqual(["-57.00"]);
  });

  it("adds VAT on top of the price to what Daily Red Sea owes the partner", async () => {
    const company = await partner("Registered Company", "on_top");
    const booking = await createBooking(db, { amount: 114, date: "2026-10-22", tour_slug: "giftun" });
    await assignSupplier(db, booking, company, 50);
    const [line] = await lines(db, booking);
    await collectedByUs(line.id);
    const [after] = await lines(db, booking);
    expect([after.purchase_tax_mode, n(after.purchase_tax_amount), n(after.partner_cost_ex_vat_usd), n(after.margin_ex_vat_usd)]).toEqual(["on_top", "7.00", "50.00", "50.00"]);
    const payable = (await ledger(db, { bookingId: booking })).filter((entry) => entry.entry_type === "supplier_cost_payable" && !entry.is_reversal);
    expect(payable.map((entry) => n(entry.amount))).toEqual(["-57.00"]);
  });

  it("keeps the VAT the partner adds out of what they owe us when they collect", async () => {
    const company = await partner("Collecting Company", "on_top");
    const booking = await createBooking(db, { amount: 114, date: "2026-10-22", tour_slug: "giftun" });
    await assignSupplier(db, booking, company, 50);
    const entries = await ledger(db, { bookingId: booking });
    expect(entries.filter((entry) => entry.entry_type === "commission_receivable").map((entry) => n(entry.amount))).toEqual(["57.00"]);
  });

  it("adds VAT on top for extra partners too", async () => {
    const guide = await partner("Registered Guide", "on_top");
    const booking = await createBooking(db, { amount: 114, date: "2026-10-23", tour_slug: "giftun" });
    const [line] = await lines(db, booking);
    const { rows: [cost] } = await asOwner(() => db.query<Row>("select * from public.finance_add_partner_cost($1, $2, 'guide', 20, 'USD')", [line.id, guide]));
    expect([cost.tax_mode, n(cost.tax_amount)]).toEqual(["on_top", "2.80"]);
    const entries = await ledger(db, { supplierId: guide });
    expect(entries.map((entry) => n(entry.amount))).toEqual(["-22.80"]);
    const [after] = await lines(db, booking);
    // 114 - 14 VAT - 20 guide (the 2.80 VAT is deductible)
    expect(n(after.margin_ex_vat_usd)).toBe("80.00");
  });

  it("can be changed for trips from a date by the owner or accountant only", async () => {
    const boat = await partner("Now Registered Boat", "not_registered");
    const booking = await createBooking(db, { amount: 114, date: "2026-10-24", tour_slug: "giftun" });
    await assignSupplier(db, booking, boat, 57);
    const manager = await createStaff(db, "manager");
    await actAs(db, manager);
    await expect(db.query("select public.finance_set_partner_vat_status($1, 'included', '2026-10-01')", [boat])).rejects.toThrow(/manage_finance/);
    const { rows: [result] } = await asOwner(() => db.query<{ r: Row }>("select public.finance_set_partner_vat_status($1, 'included', '2026-10-01') as r", [boat]));
    expect(result.r).toMatchObject({ vat_status: "included", trips_updated: 1 });
    const [line] = await lines(db, booking);
    expect([line.purchase_tax_mode, n(line.purchase_tax_amount)]).toEqual(["included", "7.00"]);
  });
});

describe("VAT return by tax point", () => {
  it("taxes a deposit in the month it is received and the rest in the trip month, with the filing date", async () => {
    const before = await db.query<Row>("select month::text, output_vat_usd from public.finance_vat_summary where country = 'EG' order by month");
    const booking = await createBooking(db, { amount: 114, date: "2026-10-25", tour_slug: "giftun", payment_status: "unpaid" });
    await pay(booking, 57, "2026-09-15");
    const { rows } = await db.query<Row>("select month::text, output_vat_usd, filing_due_on::text, filing_frequency from public.finance_vat_summary where country = 'EG' order by month");
    const september = rows.find((row) => row.month === "2026-09-01");
    expect([n(september?.output_vat_usd), september?.filing_due_on, september?.filing_frequency]).toEqual(["7.00", "2026-10-31", "monthly"]);
    const octBefore = before.rows.find((row) => row.month === "2026-10-01");
    const octAfter = rows.find((row) => row.month === "2026-10-01");
    expect(n(Number(octAfter?.output_vat_usd) - Number(octBefore?.output_vat_usd ?? 0))).toBe("7.00");
  });
});

describe("guest payments still to record", () => {
  it("lists trips Daily Red Sea collects that are marked paid without a recorded payment, until it is recorded", async () => {
    const paid = await createBooking(db, { amount: 80, date: "2026-10-26", tour_slug: "giftun", payment_status: "paid" });
    const [line] = await lines(db, paid);
    await collectedByUs(line.id);
    const partnerCollects = await createBooking(db, { amount: 80, date: "2026-10-26", tour_slug: "giftun", payment_status: "paid" });
    const queue = async () => (await db.query<Row>("select booking_id, reason from public.finance_payments_to_record")).rows;
    expect(await queue()).toContainEqual({ booking_id: paid, reason: "marked_paid" });
    expect((await queue()).some((row) => row.booking_id === partnerCollects)).toBe(false);
    await pay(paid, 80, "2026-09-20", "balance");
    expect((await queue()).some((row) => row.booking_id === paid)).toBe(false);
  });

  it("lists past trips Daily Red Sea collects with nothing recorded", async () => {
    const past = await createBooking(db, { amount: 60, date: "2026-08-10", tour_slug: "giftun", payment_status: "unpaid", status: "completed" });
    const [line] = await lines(db, past);
    await collectedByUs(line.id);
    const { rows } = await db.query<Row>("select reason from public.finance_payments_to_record where booking_id = $1", [past]);
    expect(rows).toEqual([{ reason: "trip_done_unpaid" }]);
  });
});

describe("as a real signed-in admin (not the database superuser)", () => {
  it("can read the VAT returns and the payments to record, and set a partner's VAT status", async () => {
    const accountant = await createStaff(db, "finance");
    const boat = await partner("Signed-in Boat", "not_registered");
    // Supabase grants signed-in users table access (row-level security decides the rows); mirror that here.
    await db.exec(`grant select on public.bookings, public.booking_financial_lines, public.booking_line_partner_costs, public.guest_payments,
      public.expenses, public.tax_jurisdictions, public.tax_rates, public.suppliers to authenticated`);
    await actAs(db, accountant);
    await db.exec("set role authenticated");
    try {
      const { rows: vat } = await db.query<Row>("select country, month::text, filing_due_on::text from public.finance_vat_summary where country = 'EG' and month = '2026-09-01'");
      expect(vat).toEqual([{ country: "EG", month: "2026-09-01", filing_due_on: "2026-10-31" }]);
      await db.query("select count(*) from public.finance_payments_to_record");
      const { rows: [result] } = await db.query<{ r: Row }>("select public.finance_set_partner_vat_status($1, 'on_top') as r", [boat]);
      expect(result.r).toMatchObject({ vat_status: "on_top" });
    } finally {
      await db.exec("reset role");
    }
  });
});
