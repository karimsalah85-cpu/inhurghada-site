import { describe, expect, it } from "vitest";
import { summarizeCashFlow } from "@/lib/finance/cash-flow";

describe("cash flow by transaction date", () => {
  it("uses exact dates within a month, signed cash movement and decimal precision", () => {
    const result = summarizeCashFlow([
      { occurred_on: "2026-11-01", cash_effect_usd: "999.00" },
      { occurred_on: "2026-11-10", cash_effect_usd: "100.10" },
      { occurred_on: "2026-11-11", cash_effect_usd: "0.20" },
      { occurred_on: "2026-11-12", cash_effect_usd: "-25.05" },
      { occurred_on: "2026-11-20", cash_effect_usd: "999.00" },
    ], { from: "2026-11-10", to: "2026-11-15" });
    expect(result).toEqual([{ month: "2026-11-01", cash_in_usd: "100.30", cash_out_usd: "25.05", net_cash_usd: "75.25", usd_pending: 0 }]);
  });
  it("keeps missing FX separate and inserts months without cash movement across a year boundary", () => {
    const result = summarizeCashFlow([
      { occurred_on: "2026-12-01", cash_effect_usd: null },
      { occurred_on: "2027-02-10", cash_effect_usd: "-10.00" },
    ], { from: "2026-12-01", to: "2027-02-28" });
    expect(result).toHaveLength(3);
    expect(result[0].usd_pending).toBe(1);
    expect(result[1]).toEqual({ month: "2027-01-01", cash_in_usd: "0.00", cash_out_usd: "0.00", net_cash_usd: "0.00", usd_pending: 0 });
    expect(result[2].net_cash_usd).toBe("-10.00");
  });
});
