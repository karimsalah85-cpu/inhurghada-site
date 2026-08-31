import { describe, expect, it } from "vitest";
import {
  DEFAULT_EXPENSE_TYPES,
  expenseOptionsLabel,
  normalizeExpensePayload,
  slugifyExpenseType,
} from "@/lib/admin-expense-write";

describe("slugifyExpenseType", () => {
  it("turns a label into a stable key", () => {
    expect(slugifyExpenseType("Boat fuel & oil")).toBe("boat_fuel_oil");
    expect(slugifyExpenseType("  Port Fees  ")).toBe("port_fees");
    expect(slugifyExpenseType("Docking / mooring")).toBe("docking_mooring");
  });

  it("caps length and trims separators", () => {
    expect(slugifyExpenseType("!!!")).toBe("");
    expect(slugifyExpenseType("x".repeat(60)).length).toBe(40);
  });
});

describe("normalizeExpensePayload with a custom allowed set", () => {
  const base = { description: "Port fees", amount: 120, date: "2026-08-31" };

  it("accepts a custom key that is in the allowed set", () => {
    const allowed = new Set([...DEFAULT_EXPENSE_TYPES.map((t) => t.key), "port_fees"]);
    const result = normalizeExpensePayload({ ...base, expense_type: "port_fees" }, allowed);
    expect("value" in result && result.value.expenseType).toBe("port_fees");
  });

  it("falls back to 'other' when the key is not allowed", () => {
    const allowed = new Set(DEFAULT_EXPENSE_TYPES.map((t) => t.key));
    const result = normalizeExpensePayload({ ...base, expense_type: "port_fees" }, allowed);
    expect("value" in result && result.value.expenseType).toBe("other");
  });
});

describe("expenseOptionsLabel", () => {
  it("labels built-in keys and falls back to Other", () => {
    expect(expenseOptionsLabel("fuel")).toBe("Fuel");
    expect(expenseOptionsLabel("port_fees")).toBe("Other");
  });
});
