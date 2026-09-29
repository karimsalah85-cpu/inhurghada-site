import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createFinanceDatabase, n, type FinanceDb } from "./support/finance-db";

const seed = (name: string) => readFileSync(new URL(`../supabase/${name}`, import.meta.url), "utf8");
let db: FinanceDb;

beforeAll(async () => {
  db = await createFinanceDatabase();
  await db.exec(seed("seed.sql"));
  await db.exec(seed("seeds/finance_demo.sql"));
}, 120_000);
afterAll(async () => { await db?.close(); });

describe("synthetic finance demo seed", () => {
  it("loads twice without duplicating anything", async () => {
    await db.exec(seed("seeds/finance_demo.sql"));
    const { rows: [count] } = await db.query<{ bookings: number; partners: number }>(
      "select (select count(*)::int from public.bookings where reference like 'DEMO-%') as bookings, (select count(*)::int from public.suppliers where name like 'Demo %') as partners");
    expect(count).toEqual({ bookings: 5, partners: 6 });
  });

  it("produces the expected partner balances in EGP", async () => {
    const { rows } = await db.query<{ name: string; balance: string }>(
      `select s.name, b.balance::text from public.supplier_balances b join public.suppliers s on s.id = b.supplier_id
       where s.name like 'Demo %' and b.currency = 'EGP' order by s.name`);
    // Negative = Daily Red Sea owes the partner; positive = the partner owes Daily Red Sea.
    // Driver: collected EGP 1,200 cash for a EGP 600 transfer (+600), owed EGP 300 for DEMO-1002 (-300).
    // Guide: EGP 400 on DEMO-1001 plus the EGP 100 cancellation fee on the cancelled safari.
    expect(rows.map((row) => [row.name, n(row.balance)])).toEqual([
      ["Demo Captain Boat", "-2400.00"],
      ["Demo Driver", "300.00"],
      ["Demo Guide", "-500.00"],
      ["Demo Marsa Alam Dive Co", "-3000.00"],
    ]);
  });

  it("converts every demo line to USD at the stored rate", async () => {
    const { rows: [line] } = await db.query<Record<string, string>>(
      `select l.net_sales_usd::text, l.supplier_cost_usd::text, l.total_partner_cost_usd::text, l.margin_amount_usd::text from public.booking_financial_lines l
       join public.bookings b on b.id = l.booking_id where b.reference = 'DEMO-1001'`);
    // EUR 90 at 0.86 EUR/USD = USD 104.65; boat EGP 2,400 at 48.50 = USD 49.48; guide EGP 400 = USD 8.25;
    // 10% agent commission = EUR 9 = USD 10.47.
    expect([n(line.net_sales_usd), n(line.supplier_cost_usd), n(line.total_partner_cost_usd), n(line.margin_amount_usd)])
      .toEqual(["104.65", "49.48", "57.73", "36.45"]);
  });

  it("records the demo guest payments, refund, credit note and cancellation", async () => {
    const { rows } = await db.query<{ reference: string; payment_state: string; outstanding: string }>(
      "select reference, payment_state, outstanding::text from public.booking_payment_summary where reference like 'DEMO-%' order by reference");
    expect(rows.map((row) => [row.reference, row.payment_state, n(row.outstanding)])).toEqual([
      ["DEMO-1001", "paid", "0.00"],
      ["DEMO-1002", "partly_refunded", "0.00"],
      ["DEMO-1003", "refunded", "0.00"],
      ["DEMO-1004", "paid", "0.00"],
      ["DEMO-1005", "unpaid", "1200.00"],
    ]);
    const { rows: [note] } = await db.query<{ status: string; remaining: string }>("select status, remaining::text from public.credit_note_balances where number = 'CN-2026-D001'");
    expect([note.status, n(note.remaining)]).toEqual(["open", "20.00"]);
    const { rows: [impact] } = await db.query<{ bookings: number; lost_sales_usd: string }>(
      "select bookings, lost_sales_usd::text from public.finance_cancellation_impact where month = '2026-09-01' and reason = 'weather'");
    expect([impact.bookings, n(impact.lost_sales_usd)]).toEqual([1, "70.00"]);
  });
});
