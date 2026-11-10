import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { activeNavPage, adminNav, searchAdminNav, visibleNav } from "@/components/admin/admin-nav";

const allPages = adminNav.flatMap((group) => group.sections.flatMap((section) => section.pages));

describe("admin navigation", () => {
  it("points every link at a real admin page", () => {
    for (const page of allPages) {
      const file = join(process.cwd(), "app", page.href === "/admin" ? "admin" : page.href.slice(1), "page.tsx");
      expect(existsSync(file), `${page.href} has no page.tsx`).toBe(true);
    }
  });

  it("never lists the same page twice", () => {
    const hrefs = allPages.map((page) => page.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("keeps the sidebar short", () => {
    const sections = adminNav.flatMap((group) => group.sections);
    expect(sections.length).toBeLessThanOrEqual(17);
  });

  it("finds the most specific page and its section", () => {
    expect(activeNavPage("/admin/finance/suppliers/abc")?.page.href).toBe("/admin/finance/suppliers");
    expect(activeNavPage("/admin/finance/suppliers/abc")?.section.label).toBe("Finance");
    expect(activeNavPage("/admin/reports/profit")?.section.label).toBe("Insights");
    expect(activeNavPage("/admin/settings/redirects")?.page.label).toBe("Redirects");
    expect(activeNavPage("/admin")?.section.label).toBe("Today");
    expect(activeNavPage("/admin/unknown")).toBeNull();
  });

  it("hides sections a role cannot open and starts each section at its first permitted page", () => {
    const nav = visibleNav(["reports"], "sales");
    const sections = nav.flatMap((group) => group.sections);
    expect(sections.map((section) => section.label)).toEqual(["Today", "Bookings", "Insights"]);
    const insights = sections.find((section) => section.label === "Insights")!;
    expect(insights.pages.map((page) => page.href)).toEqual(["/admin/reports"]);
  });

  it("lets a finance user reach currency settings without other settings", () => {
    const settings = visibleNav(["finance"], "finance").flatMap((group) => group.sections).find((section) => section.label === "Site settings");
    expect(settings?.pages.map((page) => page.href)).toEqual(["/admin/currency"]);
  });
});

describe("admin destination search", () => {
  it("opens a matching subpage rather than its section landing page", () => {
    const result = searchAdminNav(adminNav, "VAT");
    expect(result.flatMap((group) => group.sections.flatMap((section) => section.pages.map((page) => page.href)))).toEqual(["/admin/finance/vat"]);
    expect(searchAdminNav(adminNav, "pickup manifest")[0].sections[0].pages[0].href).toBe("/admin/operations/manifest");
  });
  it("keeps search within permitted destinations", () => {
    expect(searchAdminNav(visibleNav(["operations"], "operator"), "VAT")).toEqual([]);
    const staffOnly = visibleNav(["staff"], "operator");
    expect(staffOnly.flatMap((group) => group.sections.flatMap((section) => section.pages)).some((page) => page.href === "/admin/users")).toBe(false);
  });
  it("retains section keyword discovery and handles empty searches", () => {
    expect(searchAdminNav(adminNav, "weather")[0].sections[0].pages[0].href).toBe("/admin/availability");
    expect(searchAdminNav(adminNav, "  ")).toBe(adminNav);
    expect(searchAdminNav(adminNav, "unknown destination")).toEqual([]);
  });
});

it("preserves operator access to the existing supplier cost workspace without granting finance", () => {
  const pages = visibleNav(["bookings", "operations"], "operator").flatMap((group) => group.sections.flatMap((section) => section.pages));
  expect(pages.some((page) => page.href === "/admin/suppliers")).toBe(true);
  expect(pages.some((page) => page.href === "/admin/finance")).toBe(false);
});
