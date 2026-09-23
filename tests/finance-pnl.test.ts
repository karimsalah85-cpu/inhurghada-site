import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  computePnl, drilldown, grossView, marginsBy, monthlyTrend, netRevenueView, pnlCsv, previousPeriod, type PnlExpense, type PnlLine,
} from "@/lib/finance/pnl";
import { fromMinor, toMinor } from "@/lib/finance/money";
import { actAs, assignSupplier, createBooking, createFinanceDatabase, createSupplier, owner, setRate, system, type FinanceDb } from "./support/finance-db";

let serial = 0;
function line(partial: Partial<PnlLine> = {}): PnlLine {
  serial += 1;
  return {
    line_id: `l${serial}`, booking_id: `b${serial}`, reference: `DRS-${serial}`, trip_date: "2026-10-10", tour_slug: "reef", tour_name: "Reef",
    destination: "hurghada", product_line: "Island Trip", supplier_id: "s1", supplier_name: "Blue Boat", outcome: "completed",
    gross_usd: "100.00", discount_usd: "0.00", refund_usd: "0.00", net_sales_usd: "100.00", supplier_cost_usd: "60.00",
    agent_commission_usd: "0.00", payment_fees_usd: "0.00", margin_amount_usd: "40.00", ...partial,
  };
}
function expense(partial: Partial<PnlExpense> = {}): PnlExpense {
  serial += 1;
  return {
    id: `x${serial}`, description: "Hosting", expense_date: "2026-10-05", expense_type: "subscriptions", category: null, vendor: "Vercel",
    source: "manual", amount: "20.00", currency: "USD", amount_usd: "20.00", supplier_id: null, booking_id: null, ...partial,
  };
}
const labels = { subscriptions: "Subscriptions", google_ads: "Google Ads" };
const value = (rows: ReturnType<typeof grossView>, key: string) => rows.find((row) => row.key === key)?.current;

describe("P&L math", () => {
  const lines = [
    line({ gross_usd: "200.00", discount_usd: "20.00", net_sales_usd: "180.00", supplier_cost_usd: "100.00", agent_commission_usd: "18.00", payment_fees_usd: "5.40", margin_amount_usd: "56.60" }),
    line({ gross_usd: "100.00", refund_usd: "25.00", net_sales_usd: "75.00", supplier_cost_usd: "60.00", margin_amount_usd: "15.00" }),
    line({ net_sales_usd: null }),
  ];
  const expenses = [expense(), expense({ expense_type: "google_ads", amount_usd: "30.10" }), expense({ amount_usd: null })];
  const result = computePnl(lines, expenses, labels);
  const gross = grossView(result, null);
  const net = netRevenueView(result, null);

  it("builds the gross view from booking value down to net profit", () => {
    expect(["gross", "discounts", "refunds", "net_sales", "supplier_costs", "gross_profit", "gross_margin_pct", "agent_commissions", "payment_fees", "contribution", "opex", "net_profit", "net_margin_pct"]
      .map((key) => value(gross, key))).toEqual(["300.00", "20.00", "25.00", "255.00", "160.00", "95.00", "37.25", "18.00", "5.40", "71.60", "50.10", "21.50", "8.43"]);
  });

  it("builds the net revenue view to the same net profit", () => {
    expect(["drs_net_revenue", "contribution", "contribution_pct", "net_profit", "net_margin_pct"].map((key) => value(net, key)))
      .toEqual(["95.00", "71.60", "75.37", "21.50", "22.63"]);
    expect(value(net, "net_profit")).toBe(value(gross, "net_profit"));
  });

  it("lists operating expenses by category, largest first", () => {
    expect(gross.filter((row) => row.key.startsWith("opex:")).map((row) => [row.label, row.current])).toEqual([["Google Ads", "30.10"], ["Subscriptions", "20.00"]]);
  });

  it("leaves out and counts records whose USD value is pending", () => {
    expect(result.pending).toEqual({ lines: 1, expenses: 1 });
    expect(result.bookings).toBe(2);
  });

  it("drill-downs add up to the statement line", () => {
    for (const key of ["gross", "discounts", "refunds", "net_sales", "supplier_costs", "gross_profit", "agent_commissions", "payment_fees", "contribution", "opex", "opex:google_ads"]) {
      const rows = drilldown(key, lines, expenses)!;
      const total = fromMinor(rows.reduce((sum, row) => sum + toMinor(row.amount), 0n));
      expect([key, total]).toEqual([key, gross.find((row) => row.drill === key)?.current ?? value(gross, key)]);
    }
    expect(drilldown("unknown", lines, expenses)).toBeNull();
  });

  it("compares with the previous period (absolute and percentage-point change)", () => {
    const previous = computePnl([line()], [expense()], labels);
    const rows = grossView(result, previous);
    expect(rows.find((row) => row.key === "net_sales")).toMatchObject({ current: "255.00", previous: "100.00", change: "155.00" });
    expect(rows.find((row) => row.key === "gross_margin_pct")).toMatchObject({ current: "37.25", previous: "40.00", change: "-2.75" });
  });

  it("computes the previous period of the same length", () => {
    expect(previousPeriod("2026-10-01", "2026-10-31")).toEqual({ from: "2026-08-31", to: "2026-09-30" });
    expect(previousPeriod("2026-03-01", "2026-03-01")).toEqual({ from: "2026-02-28", to: "2026-02-28" });
  });

  it("builds a monthly trend with every month in range", () => {
    const trend = monthlyTrend([line({ trip_date: "2026-08-20" }), line({ trip_date: "2026-10-02" })], [expense({ expense_date: "2026-09-10" })], "2026-08-01", "2026-10-31");
    expect(trend).toEqual([
      { month: "2026-08", net_sales: "100.00", costs: "60.00", net_profit: "40.00" },
      { month: "2026-09", net_sales: "0.00", costs: "20.00", net_profit: "-20.00" },
      { month: "2026-10", net_sales: "100.00", costs: "60.00", net_profit: "40.00" },
    ]);
  });

  it("exports both views as CSV with the management-reporting note", () => {
    const csv = pnlCsv({ from: "2026-10-01", to: "2026-10-31", previous: null, filters: "", gross, net, pending: result.pending });
    expect(csv).toContain("not a statutory accounting statement");
    expect(csv).toContain("Discounts,-20.00");
    expect(csv).toContain("Gross margin %,37.25%");
    expect(csv).toContain("Net revenue view");
  });
});

describe("margins", () => {
  const lines = [
    line({ booking_id: "a", supplier_id: "s1", supplier_name: "Blue Boat", net_sales_usd: "100.00", margin_amount_usd: "30.00" }),
    line({ booking_id: "a", supplier_id: "s1", supplier_name: "Blue Boat", net_sales_usd: "50.00", margin_amount_usd: "2.00", tour_slug: "safari", tour_name: "Safari" }),
    line({ booking_id: "b", supplier_id: "s2", supplier_name: "Sand Tours", net_sales_usd: "80.00", margin_amount_usd: "-5.00", tour_slug: "safari", tour_name: "Safari", destination: "marsa-alam" }),
    line({ booking_id: "c", supplier_id: null, supplier_name: null, net_sales_usd: "0.00", margin_amount_usd: "0.00" }),
  ];

  it("groups by booking, tour, supplier and destination with flags, worst first", () => {
    expect(marginsBy("booking", lines, "15").map((row) => [row.label, row.net_sales, row.margin, row.margin_pct, row.flag])).toEqual([
      [lines[2].reference, "80.00", "-5.00", "-6.25", "negative"],
      [lines[3].reference, "0.00", "0.00", null, null],
      [lines[0].reference, "150.00", "32.00", "21.33", null],
    ]);
    expect(marginsBy("tour", lines, "15").map((row) => [row.label, row.margin_pct, row.flag])).toEqual([["Safari", "-2.31", "negative"], ["Reef", "30.00", null]]);
    expect(marginsBy("supplier", lines, "25").map((row) => [row.label, row.flag])).toEqual([["Sand Tours", "negative"], ["No supplier assigned", null], ["Blue Boat", "below_threshold"]]);
    expect(marginsBy("destination", lines, "15").map((row) => [row.label, row.bookings])).toEqual([["Marsa Alam", 1], ["Hurghada", 2]]);
  });
});

describe("P&L from real booking financials (in-memory Postgres)", () => {
  let db: FinanceDb;
  beforeAll(async () => {
    db = await createFinanceDatabase();
    await setRate(db, "2026-10-10", "EUR", 0.8);
    await setRate(db, "2026-10-12", "EGP", 50);
  }, 120_000);
  afterAll(async () => { await db?.close(); });

  it("reconciles the statement with the stored per-line USD figures", async () => {
    const supplier = await createSupplier(db);
    const eur = await createBooking(db, { amount: 90, subtotal: 100, currency: "EUR", date: "2026-10-10", sales_commission_percent: 10 });
    await assignSupplier(db, eur, supplier, 50, "EUR");
    const usd = await createBooking(db, { amount: 200, date: "2026-10-12" });
    await assignSupplier(db, usd, supplier, 5000, "EGP");
    const cancelled = await createBooking(db, { amount: 80, status: "cancelled", payment_status: "unpaid", date: "2026-10-11" });
    await assignSupplier(db, cancelled, supplier, 30);
    await actAs(db, owner);
    const { rows: [usdLine] } = await db.query<{ id: string }>("select id from public.booking_financial_lines where booking_id = $1", [usd]);
    await db.query("select public.finance_update_line($1, '{\"payment_fees\": 6}')", [usdLine.id]);
    await actAs(db, system);
    await db.query("insert into public.expenses(description, amount, currency, expense_date, expense_type) values ('Ads', 12.5, 'USD', '2026-10-15', 'google_ads')");

    const { rows } = await db.query<Record<string, unknown>>(
      `select l.id line_id, l.booking_id, f.reference, l.trip_date::text, l.tour_slug, l.tour_name, l.destination, l.product_line, l.supplier_id,
         s.name supplier_name, l.outcome::text, l.gross_usd::text, l.discount_usd::text, l.refund_usd::text, l.net_sales_usd::text,
         l.supplier_cost_usd::text, l.agent_commission_usd::text, l.payment_fees_usd::text, l.margin_amount_usd::text
       from public.booking_financial_lines l join public.booking_financials f using (booking_id) left join public.suppliers s on s.id = l.supplier_id
       where l.included and l.booking_id = any($1::uuid[])`, [[eur, usd, cancelled]]);
    const expenseRows = (await db.query<Record<string, unknown>>(
      "select id, description, expense_date::text, expense_type, category, vendor, source, amount::text, currency::text, amount_usd::text, supplier_id, booking_id from public.expenses where expense_date = '2026-10-15' and voided_at is null")).rows;
    const result = computePnl(rows as unknown as PnlLine[], expenseRows as unknown as PnlExpense[], labels);
    const gross = grossView(result, null);
    // EUR: 100 gross, 10 discount, 90 net at 1.25 -> 125/12.50/112.50; cost 50 EUR -> 62.50; agent 9 EUR -> 11.25
    // USD: 200 net; cost 5000 EGP -> 100.00; fees 6.00. Cancelled unpaid: nothing recognised.
    expect(["gross", "discounts", "net_sales", "supplier_costs", "gross_profit", "agent_commissions", "payment_fees", "contribution", "opex", "net_profit"].map((key) => value(gross, key)))
      .toEqual(["325.00", "12.50", "312.50", "162.50", "150.00", "11.25", "6.00", "132.75", "12.50", "120.25"]);
    const lineMargins = rows.reduce((sum, row) => sum + toMinor(String(row.margin_amount_usd)), 0n);
    expect(fromMinor(lineMargins)).toBe(value(gross, "contribution"));
  });
});
