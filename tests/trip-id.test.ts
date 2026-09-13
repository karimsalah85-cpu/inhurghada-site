import { describe, expect, it } from "vitest";
import { normalizeTripId } from "@/lib/trip-id";

describe("trip references", () => {
  it("normalizes references for case-insensitive uniqueness", () => {
    expect(normalizeTripId(" drs-001 ")).toBe("DRS-001");
    expect(normalizeTripId("CAIRO_22")).toBe("CAIRO_22");
  });
  it("allows an admin to clear the optional reference", () => {
    expect(normalizeTripId("  ")).toBeNull();
    expect(normalizeTripId(null)).toBeNull();
  });
  it.each(["A", "ID with spaces", "A".repeat(33), "<script>", 123, {}])("rejects an invalid reference %j", value => {
    expect(() => normalizeTripId(value)).toThrow();
  });
});
