import { describe, expect, it } from "vitest";
import { canonicalAliasTarget, isKnownApplicationPath } from "@/lib/public-routes";

describe("public route guard", () => {
  it("allows known public and localized route roots", () => {
    expect(isKnownApplicationPath("/tours/orange-bay")).toBe(true);
    expect(isKnownApplicationPath("/de/tours/orange-bay")).toBe(true);
    expect(isKnownApplicationPath("/sitemap.xml")).toBe(true);
  });

  it("rejects unknown root and localized catch-all paths", () => {
    expect(isKnownApplicationPath("/definitely-not-a-real-page")).toBe(false);
    expect(isKnownApplicationPath("/de/definitely-not-real")).toBe(false);
    expect(isKnownApplicationPath("/transfers/not-real")).toBe(false);
    expect(isKnownApplicationPath("/de/transfers/not-real")).toBe(false);
  });

  it("resolves canonical aliases without losing the locale", () => {
    expect(canonicalAliasTarget("/transfers/hurghada-airport-transfer")).toBe("/tours/hurghada-airport-transfer");
    expect(canonicalAliasTarget("/de/transfers/hurghada-to-el-gouna")).toBe("/de/transfers");
    expect(canonicalAliasTarget("/en/tours/orange-bay-boat-trip-hurghada")).toBe("/tours/orange-bay");
    expect(canonicalAliasTarget("/transfers/not-real")).toBeNull();
  });
});
