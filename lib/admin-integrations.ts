import "server-only";
import { googleAdsConfiguration } from "@/lib/google-ads";
import { googleAnalyticsConfiguration } from "@/lib/google-analytics";

export type CheckStatus = "ok" | "warning" | "failed";
export type RecordedCheck = { status: CheckStatus; summary: string | null; checked_at: string };
export type HealthCheckRow = RecordedCheck & { check_type: string };

/** Where a card's last real result comes from, if the automation records one. */
export type CheckSource = { table: "system_health_checks"; checkType: string } | { table: "backup_checks" };

export type IntegrationDefinition = {
  name: string;
  description: string;
  /** Returns the names of missing variables in this deployment; empty means configured. */
  missing: () => string[];
  check?: CheckSource;
  checkLabel?: string;
};

const present = (key: string) => Boolean(process.env[key]?.trim());
const allOf = (...keys: string[]) => () => keys.filter((key) => !present(key));
const anyOf = (...keys: string[]) => () => (keys.some(present) ? [] : [keys.join(" or ")]);

export const integrations: IntegrationDefinition[] = [
  {
    name: "Supabase service role",
    description: "Privileged server access used by bookings, admin APIs, webhooks and automation.",
    missing: allOf("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"),
    check: { table: "system_health_checks", checkType: "database" },
    checkLabel: "Last automated database check",
  },
  {
    name: "Scheduled automation (cron)",
    description: "Daily Vercel Cron call to /api/cron/admin-automation, authenticated with CRON_SECRET.",
    missing: allOf("CRON_SECRET"),
    // Every automation run writes a "database" health check, so its timestamp is the last successful run.
    check: { table: "system_health_checks", checkType: "database" },
    checkLabel: "Last automation run",
  },
  {
    name: "Managed backups check",
    description: "Verifies the latest completed Supabase backup through the Management API.",
    missing: allOf("SUPABASE_ACCESS_TOKEN"),
    check: { table: "backup_checks" },
    checkLabel: "Last backup verification",
  },
  {
    name: "Email",
    description: "Customer and staff email via Gmail SMTP or Resend.",
    missing: anyOf("GMAIL_SMTP_APP_PASSWORD", "RESEND_API_KEY"),
    check: { table: "system_health_checks", checkType: "email" },
    checkLabel: "Last automated check",
  },
  {
    name: "WhatsApp (Twilio)",
    description: "Outbound WhatsApp messages and the signed inbound webhook.",
    missing: allOf("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_WHATSAPP_FROM"),
  },
  {
    name: "Google Analytics",
    description: "GA4 Data API reporting on the admin analytics page (OAuth refresh token).",
    missing: () => [...googleAnalyticsConfiguration().missing],
  },
  {
    name: "Google Ads",
    description: "Read-only Google Ads reporting (OAuth refresh token or service account).",
    missing: () => [...googleAdsConfiguration().missing],
    check: { table: "system_health_checks", checkType: "analytics" },
    checkLabel: "Last automated check",
  },
  {
    name: "Meta Conversions API",
    description: "Server-side Meta events that deduplicate with the browser pixel.",
    missing: allOf("NEXT_PUBLIC_META_PIXEL_ID", "META_CONVERSIONS_API_ACCESS_TOKEN", "META_GRAPH_API_VERSION"),
  },
  {
    name: "Google Places reviews",
    description: "Live Google Business reviews on the public site (Places API New).",
    missing: allOf("GOOGLE_PLACES_API_KEY"),
  },
];

export function latestCheck(source: CheckSource | undefined, health: HealthCheckRow[], backups: RecordedCheck[]): RecordedCheck | null {
  if (!source) return null;
  const rows = source.table === "backup_checks" ? backups : health.filter((row) => row.check_type === source.checkType);
  return rows.reduce<RecordedCheck | null>((latest, row) => (!latest || row.checked_at > latest.checked_at ? row : latest), null);
}

export function integrationStatuses(health: HealthCheckRow[], backups: RecordedCheck[]) {
  return integrations.map((integration) => {
    const missing = integration.missing();
    return { name: integration.name, description: integration.description, configured: missing.length === 0, missing, checkLabel: integration.checkLabel, hasCheckSource: Boolean(integration.check), lastCheck: latestCheck(integration.check, health, backups) };
  });
}
