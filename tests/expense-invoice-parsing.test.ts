import { describe, expect, it } from "vitest";
import {
  categorize,
  detectCurrency,
  detectDate,
  normalizeAmount,
  parseInvoiceText,
} from "@/lib/expense-invoice-parsing";

describe("normalizeAmount", () => {
  it("reads US grouping", () => {
    expect(normalizeAmount("1,234.56")).toBe(1234.56);
    expect(normalizeAmount("$0.99")).toBe(0.99);
  });

  it("reads European grouping", () => {
    expect(normalizeAmount("1.234,56")).toBe(1234.56);
    expect(normalizeAmount("1 234,56")).toBe(1234.56);
  });

  it("collapses repeated thousands separators", () => {
    expect(normalizeAmount("1.234.567")).toBe(1234567);
    expect(normalizeAmount("2,500")).toBe(2500);
  });

  it("keeps a plain decimal", () => {
    expect(normalizeAmount("1234.5")).toBe(1234.5);
  });
});

describe("detectCurrency", () => {
  it("finds ISO codes and symbols", () => {
    expect(detectCurrency("Total EUR 1.234,56")).toBe("EUR");
    expect(detectCurrency("Amount due $1,234.56")).toBe("USD");
    expect(detectCurrency("الإجمالي 500 ج.م")).toBe("EGP");
  });
});

describe("detectDate", () => {
  it("normalises day-first, dotted, and ISO dates to ISO", () => {
    expect(detectDate("Invoice Date: 03/15/2025")).toBe("2025-03-15");
    expect(detectDate("Datum 15.03.2025")).toBe("2025-03-15");
    expect(detectDate("Issued 2025-03-15")).toBe("2025-03-15");
    expect(detectDate("التاريخ: 15 مارس 2025")).toBe("2025-03-15");
  });
});

describe("categorize", () => {
  it("maps keywords to the existing expense types", () => {
    expect(categorize("Google Ads campaign").expenseType).toBe("google_ads");
    expect(categorize("Marina mooring fees").expenseType).toBe("boat_costs");
    expect(categorize("Monthly subscription renewal").expenseType).toBe("subscriptions");
    expect(categorize("Diesel for the boat").expenseType).toBe("fuel");
    expect(categorize("Stationery order").expenseType).toBe("other");
  });
});

describe("parseInvoiceText", () => {
  it("parses a US-style digital invoice", () => {
    const parsed = parseInvoiceText(
      [
        "Acme Supplies LLC",
        "Tax Invoice",
        "Invoice Date: 03/15/2025",
        "Snorkel masks x10        900.00",
        "Subtotal                 900.00",
        "Tax                       90.00",
        "Grand Total          $1,234.56",
      ].join("\n"),
    );
    expect(parsed.vendor).toBe("Acme Supplies LLC");
    expect(parsed.amount).toBe(1234.56);
    expect(parsed.currency).toBe("USD");
    expect(parsed.date).toBe("2025-03-15");
  });

  it("parses a European-style invoice and ignores the subtotal", () => {
    const parsed = parseInvoiceText(
      ["Bootswerft Rot GmbH", "Rechnung", "15.03.2025", "Zwischensumme 1.000,00", "Total EUR 1.234,56"].join("\n"),
    );
    expect(parsed.amount).toBe(1234.56);
    expect(parsed.currency).toBe("EUR");
    expect(parsed.date).toBe("2025-03-15");
  });

  it("parses an Arabic fuel invoice", () => {
    const parsed = parseInvoiceText(["محطة وقود مصر", "فاتورة", "التاريخ: 15 مارس 2025", "الإجمالي 500 ج.م"].join("\n"));
    expect(parsed.amount).toBe(500);
    expect(parsed.currency).toBe("EGP");
    expect(parsed.date).toBe("2025-03-15");
    expect(parsed.expenseType).toBe("fuel");
  });

  it("falls back to the largest number when there is no total line", () => {
    const parsed = parseInvoiceText(["Corner Shop", "2 coffees 60.00", "1 water 15.00", "Paid cash 75.00"].join("\n"));
    expect(parsed.amount).toBe(75);
  });

  it("returns low confidence for unreadable text", () => {
    const parsed = parseInvoiceText("%%%% ??? \n ###");
    expect(parsed.amount).toBeNull();
    expect(parsed.confidence).toBeLessThan(0.3);
  });
});
