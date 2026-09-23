import { describe, expect, it } from "vitest";
import {
  expenseInputFromBody, firstIssue, fxOverrideSchema, ledgerEntrySchema, lineUpdateSchema, netSettlementSchema, reverseEntrySchema, voidExpenseSchema,
} from "@/lib/finance/schemas";
import { normalizeExpensePayload } from "@/lib/admin-expense-write";

const id = "3f1c2b8e-6a3d-4f5e-9b1a-2c3d4e5f6a7b";
const otherId = "8a1c2b8e-6a3d-4f5e-9b1a-2c3d4e5f6a7c";

describe("expense schema (shared by create and update)", () => {
  const base = { description: "Port fees", amount: "120.5", date: "2026-08-31" };

  it("normalizes amounts to canonical decimal strings and defaults the currency", () => {
    const parsed = expenseInputFromBody(base);
    expect(parsed.success && parsed.data).toMatchObject({ amount: "120.50", currency: "USD", expense_type: "other", supplier_id: null });
  });

  it("accepts the legacy expense_date field and lowercase currency", () => {
    const parsed = expenseInputFromBody({ description: "Fuel", amount: 10, expense_date: "2026-09-01", currency: "egp" });
    expect(parsed.success && [parsed.data.date, parsed.data.currency]).toEqual(["2026-09-01", "EGP"]);
  });

  it.each([
    [{ ...base, amount: -1 }, "negative"],
    [{ ...base, amount: 0 }, "zero"],
    [{ ...base, amount: "1.234" }, "two decimals"],
    [{ ...base, amount: "abc" }, "two decimals"],
    [{ ...base, currency: "AED" }, "USD, EUR"],
    [{ ...base, date: "2026-02-30" }, "valid date"],
    [{ ...base, description: "x" }, "description"],
    [{ ...base, booking_id: "not-a-uuid" }, "Invalid identifier"],
    [{ ...base, expense_type: "supplier_per_trip" }, "supplier"],
    [{ ...base, expense_type: "sales_commission" }, "sales person"],
  ])("rejects %j", (body, message) => {
    const parsed = expenseInputFromBody(body);
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(firstIssue(parsed.error)).toContain(message);
  });

  it("no longer silently turns an unknown currency into USD", () => {
    expect(normalizeExpensePayload({ ...base, currency: "XYZ" })).toMatchObject({ status: 400 });
  });

  it("requires a reason to void", () => {
    expect(voidExpenseSchema.safeParse({ reason: "  " }).success).toBe(false);
    expect(voidExpenseSchema.safeParse({ reason: "Duplicate" }).success).toBe(true);
  });
});

describe("financial line updates", () => {
  it("accepts every supported field and supplier cost mode", () => {
    for (const change of [
      { collected_by: "daily_red_sea", collection_status: "collected", collected_amount: "100" },
      { no_show: true },
      { payment_fees: "3.20", agent_commission: null, refunded_amount: "0" },
      { supplier_id: id }, { supplier_id: null },
      { supplier_cost: { mode: "percent", percent: "62.5" } },
      { supplier_cost: { mode: "amount", amount: "90", currency: "EGP" } },
      { supplier_cost: { mode: "auto" } },
    ]) expect(lineUpdateSchema.safeParse(change).success).toBe(true);
  });

  it.each([
    [{}],
    [{ selling_price: 10 }],
    [{ payment_fees: -1 }],
    [{ collected_by: "guide" }],
    [{ supplier_cost: { mode: "percent", percent: 101 } }],
    [{ supplier_cost: { mode: "amount", amount: 5 } }],
    [{ collection_status: "not_collected", collected_amount: "5" }],
  ])("rejects %j", (change) => {
    expect(lineUpdateSchema.safeParse(change).success).toBe(false);
  });
});

describe("supplier ledger entries", () => {
  const entry = { supplier_id: id, currency: "USD", entry_date: "2026-10-01" };

  it("only allows positive payments and received commissions", () => {
    expect(ledgerEntrySchema.safeParse({ ...entry, entry_type: "payment_to_supplier", amount: "50" }).success).toBe(true);
    expect(ledgerEntrySchema.safeParse({ ...entry, entry_type: "payment_to_supplier", amount: "-50" }).success).toBe(false);
    expect(ledgerEntrySchema.safeParse({ ...entry, entry_type: "commission_received_from_supplier", amount: 0 }).success).toBe(false);
  });

  it("lets adjustments be negative but requires a note", () => {
    expect(ledgerEntrySchema.safeParse({ ...entry, entry_type: "adjustment", amount: "-12.5", note: "Opening balance" }).success).toBe(true);
    expect(ledgerEntrySchema.safeParse({ ...entry, entry_type: "adjustment", amount: "-12.5" }).success).toBe(false);
    expect(ledgerEntrySchema.safeParse({ ...entry, entry_type: "adjustment", amount: "-12.5", note: "ok" }).success).toBe(false);
  });

  it("never accepts automatic entry types from a client", () => {
    for (const entryType of ["supplier_cost_payable", "commission_receivable", "reversal", "net_settlement"]) {
      expect(ledgerEntrySchema.safeParse({ ...entry, entry_type: entryType, amount: "5", note: "manual" }).success).toBe(false);
    }
  });

  it("validates net settlements and reversals", () => {
    expect(netSettlementSchema.safeParse({ idempotency_key: otherId, supplier_id: id, line_ids: [id, otherId], entry_date: "2026-10-01" }).success).toBe(true);
    expect(netSettlementSchema.safeParse({ idempotency_key: otherId, supplier_id: id, line_ids: [id, id], entry_date: "2026-10-01" }).success).toBe(false);
    expect(netSettlementSchema.safeParse({ idempotency_key: otherId, supplier_id: id, line_ids: [], entry_date: "2026-10-01" }).success).toBe(false);
    expect(netSettlementSchema.safeParse({ supplier_id: id, line_ids: [id], entry_date: "2026-10-01" }).success).toBe(false);
    expect(reverseEntrySchema.safeParse({ entry_id: id, note: "" }).success).toBe(false);
  });
});

describe("FX overrides", () => {
  it("accepts a past rate for a foreign currency", () => {
    expect(fxOverrideSchema.safeParse({ rate_date: "2026-09-01", currency: "EGP", units_per_usd: "48.75" }).success).toBe(true);
  });

  it("rejects USD, future dates and invalid rates", () => {
    expect(fxOverrideSchema.safeParse({ rate_date: "2026-09-01", currency: "USD", units_per_usd: "1" }).success).toBe(false);
    expect(fxOverrideSchema.safeParse({ rate_date: "2999-01-01", currency: "EUR", units_per_usd: "0.9" }).success).toBe(false);
    expect(fxOverrideSchema.safeParse({ rate_date: "2026-09-01", currency: "EUR", units_per_usd: "0" }).success).toBe(false);
    expect(fxOverrideSchema.safeParse({ rate_date: "2026-09-01", currency: "EUR", units_per_usd: "-1" }).success).toBe(false);
  });
});
