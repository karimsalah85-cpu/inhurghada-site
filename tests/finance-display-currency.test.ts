import { describe, expect, it } from "vitest";
import { isValidRate, usdToDisplay } from "@/lib/finance/display-currency";

describe("showing USD reports in another currency", () => {
  it("converts exactly at the chosen rate", () => {
    expect(usdToDisplay("100.00", "48.5")).toBe("4850.00");
    expect(usdToDisplay("104.65", "0.86")).toBe("90.00");
    expect(usdToDisplay(-12.34, "3.75")).toBe("-46.28");
    expect(usdToDisplay("0.01", "0.5")).toBe("0.01"); // 0.005 rounds half away from zero
  });

  it("keeps missing values missing and rejects bad rates", () => {
    expect(usdToDisplay(null, "50")).toBeNull();
    expect(() => usdToDisplay("1.00", "0")).toThrow();
    expect(isValidRate("50.1234")).toBe(true);
    expect(isValidRate("-1")).toBe(false);
    expect(isValidRate("abc")).toBe(false);
  });
});
