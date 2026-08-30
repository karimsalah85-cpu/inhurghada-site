import { createSign } from "node:crypto";

export type GoogleAdsCampaign = {
  id: string;
  name: string;
  status: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversionValue: number;
};

export type GoogleAdsReport = {
  configured: true;
  customerId: string;
  currency: string;
  from: string;
  to: string;
  totals: Omit<GoogleAdsCampaign, "id" | "name" | "status">;
  campaigns: GoogleAdsCampaign[];
};

const requiredBaseKeys = [
  "GOOGLE_ADS_DEVELOPER_TOKEN",
  "GOOGLE_ADS_CUSTOMER_ID",
] as const;

const oauthKeys = ["GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN"] as const;
const serviceAccountKeys = ["GOOGLE_ADS_SERVICE_ACCOUNT_EMAIL", "GOOGLE_ADS_SERVICE_ACCOUNT_PRIVATE_KEY"] as const;

export function googleAdsConfiguration() {
  const missing = requiredBaseKeys.filter((key) => !process.env[key]?.trim()) as string[];
  const oauthConfigured = oauthKeys.every((key) => process.env[key]?.trim());
  const serviceAccountConfigured = serviceAccountKeys.every((key) => process.env[key]?.trim());
  if (!oauthConfigured && !serviceAccountConfigured) missing.push(...oauthKeys);
  return { configured: missing.length === 0, missing };
}

let tokenCache: { token: string; expiresAt: number } | null = null;

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

async function accessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;
  if (oauthKeys.every((key) => process.env[key]?.trim())) {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
        grant_type: "refresh_token",
      }),
      cache: "no-store",
    });
    const data = await response.json() as { access_token?: string; expires_in?: number; error_description?: string };
    if (!response.ok || !data.access_token) throw new Error(data.error_description || "Google OAuth authentication failed.");
    tokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
    return tokenCache.token;
  }
  const email = process.env.GOOGLE_ADS_SERVICE_ACCOUNT_EMAIL!;
  const privateKey = process.env.GOOGLE_ADS_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(JSON.stringify({
    iss: email,
    scope: "https://www.googleapis.com/auth/adwords",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${base64Url(signer.sign(privateKey))}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    cache: "no-store",
  });
  const data = await response.json() as { access_token?: string; expires_in?: number; error_description?: string };
  if (!response.ok || !data.access_token) throw new Error(data.error_description || "Google authentication failed.");
  tokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
  return data.access_token;
}

type GoogleAdsRow = {
  customer?: { currencyCode?: string };
  campaign?: { id?: string; name?: string; status?: string };
  metrics?: { impressions?: string; clicks?: string; costMicros?: string; conversions?: number; conversionsValue?: number };
};

type GoogleAdsErrorPayload = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: Array<{
      errors?: Array<{
        message?: string;
        errorCode?: Record<string, string>;
      }>;
    }>;
  };
};

type GoogleAdsStreamBatch = { results?: GoogleAdsRow[] } & GoogleAdsErrorPayload;

// Shown on the admin page (and used to keep the daily cron quiet) when Google
// has not yet promoted the developer token past Test Account access. This is an
// account-level approval step in the Google Ads API Center, not a code bug.
export const GOOGLE_ADS_PENDING_APPROVAL_MESSAGE =
  "Google Ads: pending Google approval — apply for Basic Access in the Google Ads API Center.";

export function isDeveloperTokenNotApproved(error: unknown): boolean {
  return error instanceof Error && error.message.includes("DEVELOPER_TOKEN_NOT_APPROVED");
}

export function googleAdsErrorMessage(payload: GoogleAdsErrorPayload, status: number, requestId: string | null) {
  const error = payload.error;
  const specific = error?.details
    ?.flatMap((detail) => detail.errors || [])
    .map((detail) => {
      const code = detail.errorCode ? Object.values(detail.errorCode).find(Boolean) : undefined;
      return [code, detail.message].filter(Boolean).join(": ");
    })
    .filter(Boolean);
  const rawReason = specific?.length ? specific.join("; ") : error?.message;
  const reason = rawReason?.includes("DEVELOPER_TOKEN_NOT_APPROVED")
    ? `${rawReason} This developer token currently has Test Account access. Apply for Basic Access in the Google Ads API Center before using it with a real advertising account.`
    : rawReason;
  const label = [error?.status, error?.code || status].filter(Boolean).join(" / ");
  const fallback = status === 401
    ? "Google rejected the OAuth access token. Verify that the OAuth user can open the Ads manager account, has two-step verification enabled, and that the client ID, client secret, and refresh token in Vercel all belong to the same OAuth client."
    : "The request failed without an error description.";
  return `Google Ads API error${label ? ` (${label})` : ""}: ${reason || fallback}${requestId ? ` Request ID: ${requestId}` : ""}`;
}

export async function getGoogleAdsReport(from: string, to: string): Promise<GoogleAdsReport> {
  const configuration = googleAdsConfiguration();
  if (!configuration.configured) throw new Error(`Google Ads is not configured: ${configuration.missing.join(", ")}`);
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/\D/g, "");
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/\D/g, "");
  const apiVersion = process.env.GOOGLE_ADS_API_VERSION?.trim() || "v25";
  const token = await accessToken();
  const query = `SELECT customer.currency_code, campaign.id, campaign.name, campaign.status, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value FROM campaign WHERE segments.date BETWEEN '${from}' AND '${to}' AND campaign.status != 'REMOVED' ORDER BY metrics.cost_micros DESC`;
  const response = await fetch(`https://googleads.googleapis.com/${apiVersion}/customers/${customerId}/googleAds:searchStream`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      ...(loginCustomerId ? { "login-customer-id": loginCustomerId } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });
  const responseText = await response.text();
  let payload: GoogleAdsStreamBatch[] | GoogleAdsErrorPayload;
  try {
    payload = JSON.parse(responseText) as GoogleAdsStreamBatch[] | GoogleAdsErrorPayload;
  } catch {
    throw new Error(`Google Ads API returned an unreadable response (HTTP ${response.status}).`);
  }
  if (!response.ok || !Array.isArray(payload)) {
    const errorPayload = Array.isArray(payload)
      ? payload.find((batch) => batch.error) || {}
      : payload;
    throw new Error(googleAdsErrorMessage(errorPayload, response.status, response.headers.get("request-id")));
  }
  const rows = payload.flatMap((batch) => batch.results || []);
  const campaigns = rows.map((row): GoogleAdsCampaign => ({
    id: row.campaign?.id || "unknown",
    name: row.campaign?.name || "Unnamed campaign",
    status: row.campaign?.status || "UNKNOWN",
    impressions: Number(row.metrics?.impressions || 0),
    clicks: Number(row.metrics?.clicks || 0),
    cost: Number(row.metrics?.costMicros || 0) / 1_000_000,
    conversions: Number(row.metrics?.conversions || 0),
    conversionValue: Number(row.metrics?.conversionsValue || 0),
  }));
  const totals = campaigns.reduce((sum, campaign) => ({
    impressions: sum.impressions + campaign.impressions,
    clicks: sum.clicks + campaign.clicks,
    cost: sum.cost + campaign.cost,
    conversions: sum.conversions + campaign.conversions,
    conversionValue: sum.conversionValue + campaign.conversionValue,
  }), { impressions: 0, clicks: 0, cost: 0, conversions: 0, conversionValue: 0 });
  return { configured: true, customerId, currency: rows[0]?.customer?.currencyCode || "USD", from, to, totals, campaigns };
}
