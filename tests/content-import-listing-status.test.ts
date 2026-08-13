import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const importRoute = readFileSync("app/api/admin/control-center/import/route.ts", "utf8");

describe("content import listing status", () => {
  it("preserves each tour's local listing status during import", () => {
    expect(importRoute).toContain('listing_status: tour.listingStatus || "active"');
    expect(importRoute).not.toContain('...tours.map((tour) => ({ content_type: "tour", slug: tour.slug, locale: "en", status: "published", listing_status: "active"');
  });
});
