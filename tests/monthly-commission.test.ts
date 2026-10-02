import { describe, expect, it } from "vitest";
import { assertCurrentCommission, buildMonthlyCommission, type CommissionBalance, type CommissionLine } from "@/lib/finance/monthly-commission";
import { commissionTotals } from "@/lib/finance/commission-invoice";
import { buildCommissionInvoiceEmail } from "@/lib/finance/commission-invoice-email";
import { createCommissionInvoicePdf } from "@/lib/finance/commission-invoice-pdf";
import { mkdir, writeFile } from "node:fs/promises";

const supplier = { id: "45b9782c-c235-4db3-b9dc-124d49021a9f", name: "Al-Haddad" };
const line = (i: number, currency: "USD" | "SAR", revenue: string): CommissionLine => ({
  id: `45b9782c-c235-4db3-b9dc-124d49021a9${i}`, trip_date: "2026-09-23", tour_name: "Sunset", guests: 7,
  currency, recognised_revenue: revenue, fx_locked: true, fx_rate_to_usd: currency === "SAR" ? "0.266666666667" : "1",
  supplier_fx_locked: true, supplier_cost_source: "manual_amount", destination: "Jeddah", reference: `DRS-${i}`,
});
const lines = [
  { ...line(1, "USD", "104.50"), trip_date: "2026-09-21", guests: 1, tour_name: "Bayada Daily Snorkeling Boat Trip from Jeddah", reference: "DRS-20260920-A1C9D9" },
  { ...line(2, "USD", "152.00"), trip_date: "2026-09-21", guests: 5, reference: "DRS-20260920-ECBD64" },
  { ...line(3, "SAR", "612.00"), reference: "DRS-20260914-C0EA8C" },
];
const balances: CommissionBalance[] = lines.map((l, i) => ({ line_id: l.id, currency: l.currency, balance: ["27.50", "40.00", "210.00"][i], obligation: ["27.50", "40.00", "210.00"][i] }));
const build = (ls = lines, bs = balances) => buildMonthlyCommission(supplier, "2026-09", "USD", ls, bs);

describe("monthly commission from finance", () => {
  it("renders linked statements with exact amounts and payment direction", async () => {
    const doc = build();
    const pdf = await createCommissionInvoicePdf(doc, "DRS-COM-00000001");
    expect(pdf.toString("binary").match(/\/Type \/Page\b/g)?.length).toBe(1);
    if (process.env.GENERATE_MONTHLY_SAMPLES) {
      await mkdir("output/monthly-commission", { recursive: true });
      await writeFile("output/monthly-commission/al-haddad-preview.pdf", pdf);
      await writeFile("output/monthly-commission/al-haddad-preview.html", buildCommissionInvoiceEmail(doc, "DRS-COM-00000001").html);
    }
  });
  it("reconciles mixed currencies and uses recorded sales, not invented ticket prices", () => {
    const doc = build();
    expect(commissionTotals(doc)).toMatchObject({ sales: "419.70", commission: "123.50" });
    expect(doc.rows[2]).toMatchObject({ nativeCurrency: "SAR", nativeCommission: "210.00", commissionAmount: "56.00" });
    const html = buildCommissionInvoiceEmail(doc, "DRS-COM-TEST").html;
    expect(html).toContain("Thank you for your business");
    expect(html).toContain("payable by Al-Haddad to Daily Red Sea");
    expect(html).toContain("210.00 SAR");
    expect(html).not.toContain("Your commission statement");
  });
  it("reflects partial receipts and omits fully paid rows", () => {
    const doc = build(lines, balances.map((b, i) => ({ ...b, balance: ["0", "10", "210"][i] })));
    expect(doc.rows).toHaveLength(2);
    expect(commissionTotals(doc).commission).toBe("66.00");
    expect(() => assertCurrentCommission(build(), doc)).toThrow(/Finance has changed/);
  });
  it("is supplier-agnostic and filters months and native currencies explicitly", () => {
    const doc = buildMonthlyCommission({ ...supplier, name: "Another supplier" }, "2026-09", "SAR", [...lines, { ...line(4, "SAR", "100"), trip_date: "2026-10-01" }], balances);
    expect(doc.partner).toBe("Another supplier"); expect(doc.rows).toHaveLength(1);
    expect(commissionTotals(doc).commission).toBe("210.00");
  });
  it("does not silently omit missing exchange rates or unset supplier costs", () => {
    expect(() => build(lines.map(l => ({ ...l, fx_locked: false })), [])).toThrow(/exchange rates/);
    expect(() => build(lines.map(l => ({ ...l, fx_locked: false })))).toThrow(/locked exchange rate/);
    expect(() => build(lines.map(l => ({ ...l, supplier_cost_source: "none" })))).toThrow(/supplier split/);
  });
  it("uses stable ordering and exact pennies and rejects client row tampering", () => {
    const doc = build();
    expect(build([...lines].reverse()).source?.fingerprint).toBe(doc.source?.fingerprint);
    const tampered = structuredClone(doc); tampered.rows[0].commissionAmount = "99.00";
    expect(() => assertCurrentCommission(tampered, doc)).toThrow();
    expect(() => assertCurrentCommission({ ...doc, source: undefined }, doc)).toThrow();
    const small = build([line(1, "SAR", "1")], [{ ...balances[0], currency: "SAR", balance: "0.02" }]);
    expect(commissionTotals(small).commission).toBe("0.01");
  });
  it("rejects empty periods and handles more than a hundred bookings without truncation", () => {
    expect(() => build([], [])).toThrow(/No unpaid/);
    const many = Array.from({ length: 120 }, (_, i) => ({ ...line(1, "USD", "10"), id: `45b9782c-c235-4db3-b9dc-${String(i).padStart(12, "0")}` }));
    const doc = build(many, many.map(l => ({ line_id: l.id, currency: l.currency, balance: "2.00", obligation: "2.00" })));
    expect(doc.rows).toHaveLength(120); expect(commissionTotals(doc).commission).toBe("240.00");
  });
});
