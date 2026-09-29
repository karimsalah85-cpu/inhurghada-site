import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { actAs, createBooking, createFinanceDatabase, n, setRate, system, type FinanceDb } from "./support/finance-db";
import { normalizeExpensePayload } from "@/lib/admin-expense-write";

let db: FinanceDb;
type Row = Record<string, unknown>;

beforeAll(async () => {
  db = await createFinanceDatabase();
  await db.query("insert into public.finance_tour_dimensions(tour_slug, tour_name, destination, product_line) values ('giftun', 'Giftun', 'hurghada', 'sea')");
  for (const date of ["2026-10-01", "2026-10-12"]) await setRate(db, date, "EGP", 50);
}, 120_000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => { await actAs(db, system); });

describe("expenses linked to a tour", () => {
  it("links to a tour or to a booking, never both", async () => {
    const booking = await createBooking(db, { amount: 100, date: "2026-10-12", tour_slug: "giftun" });
    const { rows: [gear] } = await db.query<Row>("insert into public.expenses(description, amount, currency, expense_date, tour_slug) values ('Snorkel masks', 570, 'EGP', '2026-10-12', 'giftun') returning tour_slug");
    expect(gear.tour_slug).toBe("giftun");
    await expect(db.query("insert into public.expenses(description, amount, currency, expense_date, tour_slug, booking_id) values ('Both', 10, 'USD', '2026-10-12', 'giftun', $1)", [booking]))
      .rejects.toThrow(/expenses_one_direct_link/);
    await expect(db.query("insert into public.expenses(description, amount, currency, expense_date, tour_slug) values ('Bad', 10, 'USD', '2026-10-12', 'Not A Slug')")).rejects.toThrow();
  });

  it("is validated by the expense form schema", () => {
    const base = { description: "Masks", amount: "10", currency: "USD", date: "2026-10-12" };
    expect(normalizeExpensePayload({ ...base, tour_slug: "giftun" })).toMatchObject({ value: { tourSlug: "giftun", bookingId: null } });
    expect(normalizeExpensePayload({ ...base, tour_slug: "giftun", booking_id: "30000000-0000-4000-8000-000000000003" })).toMatchObject({ status: 400 });
  });
});

describe("VAT return in local currency", () => {
  it("uses EGP amounts as they are and converts other currencies at the tax-date rate", async () => {
    // Already on file from the test above: a 100 USD trip (12.28 VAT -> EGP 614.00 at 50).
    // Added here: a 114 USD trip (14.00 VAT -> EGP 700.00) and an EGP 1,140 trip (EGP 140.00 VAT, USD 2.80).
    // Purchases: the EGP 570 masks (EGP 70.00 VAT, already in EGP).
    await createBooking(db, { amount: 114, date: "2026-10-12", tour_slug: "giftun" });
    await createBooking(db, { amount: 1140, currency: "EGP", date: "2026-10-12", tour_slug: "giftun" });
    const { rows: [october] } = await db.query<Row>("select * from public.finance_vat_summary where country = 'EG' and month = '2026-10-01'");
    expect([october.local_currency, n(october.output_vat_local), n(october.input_vat_local), n(october.net_vat_local), Number(october.local_pending)])
      .toEqual(["EGP", "1454.00", "70.00", "1384.00", 0]);
    expect([n(october.output_vat_usd), n(october.input_vat_usd)]).toEqual(["29.08", "1.40"]);
  });
});
