import { describe, expect, it } from "vitest";
import {
  balanceLabel, balancesByCurrency, buildStatement, filterLedger, statementCsv, usdBalance, withRunningBalances, type LedgerEntry,
} from "@/lib/finance/supplier-ledger";
import { createSupplierStatementPdf } from "@/lib/finance/statement-pdf";
import { toMinor } from "@/lib/finance/money";

let serial = 0;
function entry(partial: Partial<LedgerEntry> & Pick<LedgerEntry, "amount" | "entry_date">): LedgerEntry {
  serial += 1;
  return {
    id: `e${serial}`, entry_no: serial, supplier_id: "s1", booking_id: null, line_id: null, entry_type: "adjustment",
    currency: "USD", amount_usd: partial.amount, reverses_entry_id: null, settlement_id: null, is_automatic: false,
    note: null, created_by_email: "info@dailyredsea.com", created_at: `${partial.entry_date}T10:00:00Z`, booking_reference: null, ...partial,
  };
}

const rates = { EGP: { usd_per_unit: "0.02", rate_date: "2026-10-01" }, EUR: { usd_per_unit: "1.25", rate_date: "2026-10-01" } };

describe("running balances", () => {
  it("runs per currency in date then entry order, over the full history", () => {
    const payable = entry({ entry_type: "supplier_cost_payable", amount: "-70.00", entry_date: "2026-10-02", line_id: "l1", booking_id: "b1", is_automatic: true });
    const egp = entry({ entry_type: "payment_to_supplier", amount: "500.00", currency: "EGP", entry_date: "2026-10-01" });
    const payment = entry({ entry_type: "payment_to_supplier", amount: "30.00", entry_date: "2026-10-03", line_id: "l1", booking_id: "b1" });
    const rows = withRunningBalances([payment, egp, payable]);
    expect(rows.map((row) => [row.id, row.running_balance])).toEqual([[egp.id, "500.00"], [payable.id, "-70.00"], [payment.id, "-40.00"]]);
  });

  it("flags reversed entries", () => {
    const original = entry({ entry_type: "payment_to_supplier", amount: "10.00", entry_date: "2026-10-01" });
    const reversal = entry({ entry_type: "reversal", amount: "-10.00", entry_date: "2026-10-02", reverses_entry_id: original.id, note: "Typo" });
    const rows = withRunningBalances([original, reversal]);
    expect(rows.map((row) => [row.reversed, row.running_balance])).toEqual([[true, "10.00"], [false, "0.00"]]);
  });
});

describe("USD position and labels", () => {
  it("converts open balances at the latest rates and labels who owes whom", () => {
    const owes = balancesByCurrency([entry({ amount: "40.00", entry_date: "2026-10-01" }), entry({ amount: "-1000.00", currency: "EGP", entry_date: "2026-10-01" })]);
    const usd = usdBalance(owes, rates);
    expect(usd.usdMinor).toBe(2000n); // 40 - 20
    expect(balanceLabel(owes, usd.usdMinor)).toEqual({ tone: "owes_us", text: "Supplier owes us $20.00" });
    const weOwe = balancesByCurrency([entry({ amount: "-80.00", currency: "EUR", entry_date: "2026-10-01" })]);
    expect(balanceLabel(weOwe, usdBalance(weOwe, rates).usdMinor).text).toBe("We owe supplier $100.00");
    const settled = balancesByCurrency([entry({ amount: "5.00", entry_date: "2026-10-01" }), entry({ amount: "-5.00", entry_date: "2026-10-02" })]);
    expect(balanceLabel(settled, 0n)).toEqual({ tone: "settled", text: "Settled" });
  });

  it("reports currencies without a rate instead of guessing", () => {
    const balances = balancesByCurrency([entry({ amount: "10.00", currency: "GBP", entry_date: "2026-10-01" })]);
    expect(usdBalance(balances, rates)).toEqual({ usdMinor: 0n, missing: ["GBP"] });
  });
});

describe("ledger filters", () => {
  const rows = withRunningBalances([
    entry({ entry_type: "commission_receivable", amount: "30.00", entry_date: "2026-10-01", line_id: "open", booking_id: "b1", booking_reference: "DRS-1", is_automatic: true }),
    entry({ entry_type: "payment_to_supplier", amount: "15.00", entry_date: "2026-10-05", line_id: "closed", booking_id: "b2", booking_reference: "DRS-2" }),
    entry({ entry_type: "adjustment", amount: "-2.00", entry_date: "2026-10-09", note: "Fuel" }),
  ]);
  const open = new Set(["open"]);
  it.each([
    [{ from: "2026-10-02" }, 2],
    [{ to: "2026-10-05" }, 2],
    [{ type: "adjustment" as const }, 1],
    [{ booking: "drs-2" }, 1],
    [{ status: "open" as const }, 1],
    [{ status: "settled" as const }, 1],
    [{ status: "reversed" as const }, 0],
    [{}, 3],
  ])("%j", (filters, count) => {
    expect(filterLedger(rows, filters, open)).toHaveLength(count);
  });
});

describe("statements", () => {
  const entries = [
    entry({ amount: "100.00", entry_date: "2026-09-15", note: "Opening" }),
    entry({ entry_type: "payment_to_supplier", amount: "25.50", entry_date: "2026-10-02", booking_reference: "DRS-9", note: '=HYPERLINK("x"), "quoted"' }),
    entry({ amount: "-1500.00", currency: "EGP", entry_date: "2026-10-03" }),
    entry({ amount: "7.00", entry_date: "2026-11-01" }),
  ];
  const statement = buildStatement({ supplierName: "Blue Boat", from: "2026-10-01", to: "2026-10-31", generatedAt: "2026-11-02", entries, rates });

  it("computes opening and closing balances around the period", () => {
    expect([...statement.opening]).toEqual([["USD", toMinor("100.00")]]);
    expect([...statement.closing]).toEqual([["USD", toMinor("125.50")], ["EGP", toMinor("-1500.00")]]);
    expect(statement.rows.map((row) => row.entry_date)).toEqual(["2026-10-02", "2026-10-03"]);
    expect(statement.label.text).toBe("Supplier owes us $95.50");
  });

  it("exports CSV with quoting and without spreadsheet formula injection", () => {
    const csv = statementCsv(statement);
    expect(csv).toContain("Supplier,Blue Boat");
    expect(csv).toContain(`"'=HYPERLINK(""x""), ""quoted"""`);
    expect(csv).toMatch(/\r\n2026-10-03,\d+,Adjustment,,,EGP,-1500\.00,-1500\.00,-1500\.00,\r\n/);
    expect(csv.split("\r\n").filter(Boolean)).toHaveLength(11); // 8 summary lines, column header, 2 period rows
  });

  it("renders a PDF statement", async () => {
    const pdf = await createSupplierStatementPdf({ ...statement, supplierName: "مركب الأزرق Blue Boat" });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(5000);
  });
});
