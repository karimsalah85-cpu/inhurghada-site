import { describe, expect, it } from "vitest";
import { isKnownApplicationPath } from "@/lib/public-routes";

describe("public route guard", () => {
  it("allows known public and localized route roots", () => {
    expect(isKnownApplicationPath("/tours/orange-bay")).toBe(true);
    expect(isKnownApplicationPath("/de/tours/orange-bay")).toBe(true);
    expect(isKnownApplicationPath("/sitemap.xml")).toBe(true);
  });

  it("rejects unknown root and localized catch-all paths", () => {
    expect(isKnownApplicationPath("/definitely-not-a-real-page")).toBe(false);
    expect(isKnownApplicationPath("/de/definitely-not-real")).toBe(false);
  });
});
