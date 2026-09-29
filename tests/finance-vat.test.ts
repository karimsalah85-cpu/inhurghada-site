import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  actAs, assignSupplier, createBooking, createFinanceDatabase, createStaff, createSupplier, lines, n, owner, setRate, system,
  type FinanceDb,
} from "./support/finance-db";

let db: FinanceDb;
type Row = Record<string, unknown>;

beforeAll(async () => {
  db = await createFinanceDatabase();
  for (const date of ["2026-06-10", "2026-06-20"]) {
    await setRate(db, date, "EUR", 0.8);
    await setRate(db, date, "EGP", 50);
  }
}, 120_000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => { await actAs(db, system); });

async function asOwner<T>(work: () => Promise<T>) {
  await actAs(db, owner);
  try { return await work(); } finally { await actAs(db, system); }
}
let serial = 0;
const createRate = (percent: number, appliesTo: string, options: { from?: string; to?: string | null; sales?: boolean; purchases?: boolean } = {}) =>
  asOwner(async () => (await db.query<Row>("select * from public.finance_create_tax_rate($1, $2, $3, $4, $5, $6, $7, $8, null)",
    [`T${++serial}`, `Test rate ${serial}`, percent, appliesTo, options.from ?? "2026-01-01", options.to ?? null, options.sales ?? false, options.purchases ?? false])).rows[0]);
const setTax = (target: string, id: unknown, rateId: unknown) =>
  asOwner(async () => (await db.query<{ result: Row }>("select public.finance_set_transaction_tax($1, $2, $3) as result", [target, id, rateId])).rows[0].result);
const clearDefaults = () => db.query("update public.tax_rates set default_for_sales = false, default_for_purchases = false");

describe("with no tax rates set up", () => {
  it("records zero VAT and changes nothing else", async () => {
    const boat = await createSupplier(db, "No VAT Boat");
    const booking = await createBooking(db, { amount: 114, date: "2026-06-20" });
    await assignSupplier(db, booking, boat, 2500, "EGP");
    const [line] = await lines(db, booking);
    expect([line.sales_tax_rate_id, n(line.sales_tax_amount), n(line.purchase_tax_amount), n(line.margin_amount)]).toEqual([null, "0.00", "0.00", "64.00"]);
    const { rows } = await db.query("select * from public.finance_vat_summary");
    expect(rows).toEqual([]);
  });
});

describe("tax rates", () => {
  it("never change their percent, code or kind, and are never deleted", async () => {
    const rate = await createRate(14, "both");
    expect(rate.code).toMatch(/^T\d+$/);
    await expect(db.query("update public.tax_rates set rate_percent = 15 where id = $1", [rate.id])).rejects.toThrow(/cannot change/);
    await expect(db.query("delete from public.tax_rates where id = $1", [rate.id])).rejects.toThrow(/never deleted/);
    const ended = await asOwner(async () => (await db.query<Row>("select * from public.finance_update_tax_rate($1, $2)", [rate.id, JSON.stringify({ effective_to: "2026-12-31", name: "Renamed" })])).rows[0]);
    expect([ended.effective_to instanceof Date ? ended.effective_to.toISOString().slice(0, 10) : ended.effective_to, ended.name]).toEqual(["2026-12-31", "Renamed"]);
  });

  it("keep a single default for sales and for purchases", async () => {
    const first = await createRate(10, "sales", { sales: true });
    const second = await createRate(12, "both", { sales: true, purchases: true });
    const { rows } = await db.query<Row>("select id, default_for_sales, default_for_purchases from public.tax_rates where id = any($1)", [[first.id, second.id]]);
    expect(rows.find((row) => row.id === first.id)?.default_for_sales).toBe(false);
    expect(rows.find((row) => row.id === second.id)).toMatchObject({ default_for_sales: true, default_for_purchases: true });
    await expect(createRate(5, "purchases", { sales: true })).rejects.toThrow();
    await clearDefaults();
  });

  it("are limited to the owner and the accountant", async () => {
    await actAs(db, await createStaff(db, "manager"));
    await expect(db.query("select public.finance_create_tax_rate('MGR', 'Manager rate', 14, 'sales', '2026-01-01')")).rejects.toThrow(/manage_finance/);
  });
});

describe("VAT on transactions", () => {
  it("takes VAT out of VAT-inclusive sales and partner costs, in each currency and in USD", async () => {
    const sales = await createRate(14, "sales");
    const purchases = await createRate(14, "purchases");
    const boat = await createSupplier(db, "VAT Boat");
    const booking = await createBooking(db, { amount: 114, date: "2026-06-20" });
    await assignSupplier(db, booking, boat, 2280, "EGP");
    const [line] = await lines(db, booking);
    await setTax("sales", line.id, sales.id);
    const main = await setTax("main_partner", line.id, purchases.id);
    // USD 114 incl. 14% = USD 14.00 VAT; EGP 2,280 incl. 14% = EGP 280.00 = USD 5.60.
    const [after] = await lines(db, booking);
    expect([n(after.sales_tax_percent), n(after.sales_tax_amount), n(after.sales_tax_usd)]).toEqual(["14.00", "14.00", "14.00"]);
    expect([n(main.tax_amount), n(after.purchase_tax_amount), n(after.purchase_tax_usd)]).toEqual(["280.00", "280.00", "5.60"]);
    // Margins and what the partner is owed are not changed by VAT.
    expect(n(after.margin_amount)).toBe(n(line.margin_amount));
    const { rows: [vat] } = await db.query<Row>("select * from public.finance_vat_summary where month = '2026-06-01'");
    expect([n(vat.output_vat_usd), n(vat.input_vat_usd), n(vat.net_vat_usd)]).toEqual(["14.00", "5.60", "8.40"]);
  });

  it("follows the recognised amount: a cancelled, unpaid trip has no sales VAT", async () => {
    const rate = await createRate(14, "both");
    const booking = await createBooking(db, { amount: 228, date: "2026-06-20" });
    const [line] = await lines(db, booking);
    await setTax("sales", line.id, rate.id);
    expect(n((await lines(db, booking))[0].sales_tax_amount)).toBe("28.00");
    await db.query("update public.bookings set status = 'cancelled', payment_status = 'unpaid' where id = $1", [booking]);
    expect(n((await lines(db, booking))[0].sales_tax_amount)).toBe("0.00");
  });

  it("applies to expenses and extra partners, and drops a voided expense's VAT", async () => {
    const rate = await createRate(10, "purchases");
    const { rows: [expense] } = await db.query<Row>("insert into public.expenses(description, amount, currency, expense_date) values ('Office printer', 1100, 'EGP', '2026-06-10') returning id");
    const taxed = await setTax("expense", expense.id, rate.id);
    expect([n(taxed.tax_amount), n(taxed.tax_usd)]).toEqual(["100.00", "2.00"]);
    await asOwner(() => db.query("select public.finance_void_expense($1, 'Duplicate receipt')", [expense.id]));
    const { rows: [voided] } = await db.query<Row>("select tax_amount from public.expenses where id = $1", [expense.id]);
    expect(n(voided.tax_amount)).toBe("0.00");

    const booking = await createBooking(db, { amount: 100, date: "2026-06-20" });
    const [line] = await lines(db, booking);
    const guide = await createSupplier(db, "VAT Guide");
    const row = (await asOwner(() => db.query<Row>("select * from public.finance_add_partner_cost($1, $2, 'guide', 550, 'EGP')", [line.id, guide]))).rows[0];
    const partnerTax = await setTax("partner_cost", row.id, rate.id);
    expect([n(partnerTax.tax_amount), n(partnerTax.tax_usd)]).toEqual(["50.00", "1.00"]);
  });

  it("refuses a rate of the wrong kind or outside its dates", async () => {
    const salesOnly = await createRate(14, "sales");
    const old = await createRate(10, "both", { from: "2025-01-01", to: "2025-12-31" });
    const booking = await createBooking(db, { amount: 100, date: "2026-06-20" });
    const [line] = await lines(db, booking);
    await expect(setTax("main_partner", line.id, salesOnly.id)).rejects.toThrow(/is for sales, not purchases/);
    await expect(setTax("sales", line.id, old.id)).rejects.toThrow(/does not apply on 2026-06-20/);
    await expect(setTax("refunds", line.id, salesOnly.id)).rejects.toThrow(/Unknown VAT target/);
  });

  it("keeps each transaction's percent when a rate ends and a new one starts", async () => {
    const standard = await createRate(14, "sales", { from: "2026-01-01", to: null });
    const booking = await createBooking(db, { amount: 114, date: "2026-06-20" });
    const [line] = await lines(db, booking);
    await setTax("sales", line.id, standard.id);
    await asOwner(() => db.query("select public.finance_update_tax_rate($1, $2)", [standard.id, JSON.stringify({ effective_to: "2026-06-30" })]));
    await createRate(15, "sales", { from: "2026-07-01" });
    // A later change to the trip (amount) recomputes VAT at the stored 14%.
    await db.query("update public.bookings set amount = 228 where id = $1", [booking]);
    const [after] = await lines(db, booking);
    expect([n(after.sales_tax_percent), n(after.sales_tax_amount)]).toEqual(["14.00", "28.00"]);
  });

  it("ignores a stored percent written directly instead of through a rate", async () => {
    const rate = await createRate(10, "purchases");
    const { rows: [expense] } = await db.query<Row>("insert into public.expenses(description, amount, currency, expense_date, tax_rate_id) values ('Snacks', 110, 'EGP', '2026-06-10', $1) returning id", [rate.id]);
    await db.query("update public.expenses set tax_percent = 99, tax_amount = 1 where id = $1", [expense.id]);
    const { rows: [after] } = await db.query<Row>("select tax_percent, tax_amount from public.expenses where id = $1", [expense.id]);
    expect([n(after.tax_percent), n(after.tax_amount)]).toEqual(["10.00", "10.00"]);
  });

  it("applies the default rates to new transactions only", async () => {
    const booking = await createBooking(db, { amount: 110, date: "2026-06-20" });
    const defaultRate = await createRate(10, "both", { sales: true, purchases: true });
    const later = await createBooking(db, { amount: 110, date: "2026-06-20" });
    expect((await lines(db, booking))[0].sales_tax_rate_id).toBeNull();
    const [line] = await lines(db, later);
    expect([line.sales_tax_rate_id, n(line.sales_tax_amount)]).toEqual([defaultRate.id, "10.00"]);
    const { rows: [expense] } = await db.query<Row>("insert into public.expenses(description, amount, currency, expense_date) values ('Fuel', 220, 'EGP', '2026-06-10') returning tax_rate_id, tax_amount");
    expect([expense.tax_rate_id, n(expense.tax_amount)]).toEqual([defaultRate.id, "20.00"]);
    // "No VAT" can still be chosen explicitly.
    const cleared = await setTax("sales", line.id, null);
    expect([cleared.tax_rate_id, n(cleared.tax_amount)]).toEqual([null, "0.00"]);
    await clearDefaults();
  });
});
