import { afterEach, describe, expect, it } from "vitest";
import { configuredAdminEmail, hasAdminPermission, isAuthorizedAdmin } from "@/lib/admin-auth";

const originalAdminEmail = process.env.ADMIN_EMAIL;

afterEach(() => {
  if (originalAdminEmail === undefined) delete process.env.ADMIN_EMAIL;
  else process.env.ADMIN_EMAIL = originalAdminEmail;
});

describe("admin authorization", () => {
  it("authorizes only the configured address, case-insensitively", () => {
    process.env.ADMIN_EMAIL = "info@dailyredsea.com";
    expect(isAuthorizedAdmin({ email: "INFO@DAILYREDSEA.COM" })).toBe(true);
    expect(isAuthorizedAdmin({ email: "other@example.com" })).toBe(false);
    expect(isAuthorizedAdmin(null)).toBe(false);
  });

  it("uses the owner address as the secure deployment default", () => {
    delete process.env.ADMIN_EMAIL;
    expect(configuredAdminEmail()).toBe("info@dailyredsea.com");
  });
  it("does not grant a sales user finance access", () => {
    const sales = { email: "sales@example.com", app_metadata: { admin_role: "sales" } };
    expect(hasAdminPermission(sales, "bookings")).toBe(true);
    expect(hasAdminPermission(sales, "finance")).toBe(false);
  });
});
