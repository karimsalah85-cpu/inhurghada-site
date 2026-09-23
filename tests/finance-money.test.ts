import { describe, expect, it } from "vitest";
import { convertMinor, formatMoney, fromMinor, isFinanceCurrency, percentOf, sumMinor, toMinor } from "@/lib/finance/money";

describe("finance money (integer minor units)", () => {
  it("parses decimal strings, numbers and Postgres numerics exactly", () => {
    expect(toMinor("12")).toBe(1200n);
    expect(toMinor("12.3")).toBe(1230n);
    expect(toMinor("-0.05")).toBe(-5n);
    expect(toMinor("150.0000")).toBe(15000n);
    expect(toMinor(19.99)).toBe(1999n);
    expect(() => toMinor("1.234")).toThrow();
    expect(() => toMinor(0.001)).toThrow();
    expect(() => toMinor("1e3")).toThrow();
    expect(() => toMinor(Number.NaN)).toThrow();
  });

  it("sums without floating point drift", () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(fromMinor(sumMinor(["0.10", "0.20", null, "", "-0.05"]))).toBe("0.25");
    expect(fromMinor(sumMinor(Array.from({ length: 1000 }, () => "0.01")))).toBe("10.00");
  });

  it("converts with a 12-decimal rate and rounds half away from zero like Postgres", () => {
    expect(convertMinor(10000n, "1.25")).toBe(12500n);
    expect(convertMinor(150000n, "0.019359048911")).toBe(2904n); // 1500 EGP -> 29.04 USD
    expect(convertMinor(1n, "0.5")).toBe(1n);
    expect(convertMinor(-1n, "0.5")).toBe(-1n);
    expect(convertMinor(3n, "0.5")).toBe(2n);
  });

  it("computes margin percentages with two decimals", () => {
    expect(percentOf(2000n, 11000n)).toBe("18.18");
    expect(percentOf(-1500n, 10000n)).toBe("-15.00");
    expect(percentOf(1n, 8n)).toBe("12.50");
    expect(percentOf(5n, 0n)).toBeNull();
  });

  it("formats and validates currencies", () => {
    expect(formatMoney("1234.5", "USD")).toBe("$1,234.50");
    expect(formatMoney(-150n, "EUR")).toBe("-€1.50");
    expect(isFinanceCurrency("EGP")).toBe(true);
    expect(isFinanceCurrency("AED")).toBe(false);
    expect(isFinanceCurrency("usd")).toBe(false);
  });
});
