import { describe, expect, it } from "vitest";
import { stripNulChars } from "@/lib/strip-nul-chars";

describe("stripNulChars", () => {
  it("removes NUL characters from nested strings, arrays and keys", () => {
    const input = {
      raw_text: "Receipt\u0000 #2692",
      line_items: [{ description: "Fuel\u0000", amount: 10 }],
      parsed: { "ven\u0000dor": "Shell\u0000", total: null, ok: true },
    };
    expect(stripNulChars(input)).toEqual({
      raw_text: "Receipt #2692",
      line_items: [{ description: "Fuel", amount: 10 }],
      parsed: { vendor: "Shell", total: null, ok: true },
    });
  });

  it("leaves null and non-string values alone", () => {
    expect(stripNulChars(null)).toBeNull();
    expect(stripNulChars(42)).toBe(42);
  });
});
