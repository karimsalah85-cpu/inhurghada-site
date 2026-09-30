import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { integrationStatuses, integrations, type HealthCheckRow, type RecordedCheck } from "@/lib/admin-integrations";

const allKeys = [
  "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "CRON_SECRET", "SUPABASE_ACCESS_TOKEN", "GMAIL_SMTP_APP_PASSWORD", "RESEND_API_KEY",
  "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_WHATSAPP_FROM", "GOOGLE_ANALYTICS_PROPERTY_ID", "GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET",
  "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_ADS_CUSTOMER_ID", "GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_SERVICE_ACCOUNT_EMAIL", "GOOGLE_ADS_SERVICE_ACCOUNT_PRIVATE_KEY",
  "NEXT_PUBLIC_META_PIXEL_ID", "META_CONVERSIONS_API_ACCESS_TOKEN", "META_GRAPH_API_VERSION", "GOOGLE_PLACES_API_KEY",
];

const byName = (health: HealthCheckRow[] = [], backups: RecordedCheck[] = []) => Object.fromEntries(integrationStatuses(health, backups).map((item) => [item.name, item]));

beforeEach(() => { for (const key of allKeys) vi.stubEnv(key, ""); });
afterEach(() => { vi.unstubAllEnvs(); });

describe("admin integrations status", () => {
  it("no longer lists Stripe and covers the operational integrations", () => {
    const names = integrations.map((item) => item.name);
    expect(names.some((name) => /stripe/i.test(name))).toBe(false);
    expect(names).toEqual(expect.arrayContaining(["Supabase service role", "Scheduled automation (cron)", "Managed backups check", "Meta Conversions API", "Google Places reviews", "Google Analytics"]));
  });

  it("does not require Google Ads-only keys for Google Analytics", () => {
    vi.stubEnv("GOOGLE_ANALYTICS_PROPERTY_ID", "123456");
    vi.stubEnv("GOOGLE_ADS_CLIENT_ID", "id");
    vi.stubEnv("GOOGLE_ADS_CLIENT_SECRET", "secret");
    vi.stubEnv("GOOGLE_ADS_REFRESH_TOKEN", "refresh");
    const status = byName();
    expect(status["Google Analytics"].configured).toBe(true);
    expect(status["Google Ads"].configured).toBe(false);
    expect(status["Google Ads"].missing).toEqual(["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CUSTOMER_ID"]);
  });

  it("requires the GA property id alongside auth", () => {
    vi.stubEnv("GOOGLE_ADS_CLIENT_ID", "id");
    vi.stubEnv("GOOGLE_ADS_CLIENT_SECRET", "secret");
    vi.stubEnv("GOOGLE_ADS_REFRESH_TOKEN", "refresh");
    expect(byName()["Google Analytics"].missing).toEqual(["GOOGLE_ANALYTICS_PROPERTY_ID"]);
  });

  it("treats email as configured when either provider is set", () => {
    expect(byName().Email.configured).toBe(false);
    vi.stubEnv("RESEND_API_KEY", "re_x");
    expect(byName().Email.configured).toBe(true);
  });

  it("attaches the latest matching recorded check", () => {
    const health: HealthCheckRow[] = [
      { check_type: "database", status: "ok", summary: "older", checked_at: "2026-09-28T07:00:00Z" },
      { check_type: "database", status: "ok", summary: "newest", checked_at: "2026-09-29T07:00:00Z" },
      { check_type: "email", status: "warning", summary: "Email delivery credentials are missing.", checked_at: "2026-09-29T07:00:00Z" },
    ];
    const backups: RecordedCheck[] = [{ status: "failed", summary: "No completed managed backup was returned.", checked_at: "2026-09-29T07:00:01Z" }];
    const status = byName(health, backups);
    expect(status["Supabase service role"].lastCheck?.summary).toBe("newest");
    expect(status["Scheduled automation (cron)"].lastCheck?.checked_at).toBe("2026-09-29T07:00:00Z");
    expect(status.Email.lastCheck?.status).toBe("warning");
    expect(status["Managed backups check"].lastCheck?.status).toBe("failed");
    expect(status["Google Ads"].lastCheck).toBeNull();
    expect(status["Meta Conversions API"].hasCheckSource).toBe(false);
  });
});
