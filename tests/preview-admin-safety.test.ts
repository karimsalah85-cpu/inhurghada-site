import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const proxy = readFileSync("proxy.ts", "utf8");

describe("preview administration isolation", () => {
  it("centrally blocks consequential admin API mutations in previews", () => {
    expect(proxy).toContain('process.env.VERCEL_ENV === "preview"');
    expect(proxy).toContain('pathname.startsWith("/api/admin/")');
    expect(proxy).toContain('["GET", "HEAD", "OPTIONS"].includes(request.method)');
    expect(proxy).toContain("Administration changes are disabled in this preview");
  });

  it("keeps authentication lifecycle endpoints available", () => {
    expect(proxy).toContain('"/api/admin/login"');
    expect(proxy).toContain('"/api/admin/logout"');
    expect(proxy).toContain('"/api/admin/forgot-password"');
  });
});
