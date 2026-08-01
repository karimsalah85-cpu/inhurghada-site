import "server-only";

type ApiValue = { value?: string };
type ApiRow = { dimensionValues?: ApiValue[]; metricValues?: ApiValue[] };
type ApiReport = { rows?: ApiRow[]; totals?: Array<{ metricValues?: ApiValue[] }>; metadata?: { timeZone?: string } };

const required = ["GOOGLE_ANALYTICS_PROPERTY_ID", "GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN"] as const;

export function googleAnalyticsConfiguration() {
  const missing = required.filter((key) => !process.env[key]?.trim());
  return { configured: missing.length === 0, missing };
}

let tokenCache: { token: string; expiresAt: number } | null = null;
async function accessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID!, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!, grant_type: "refresh_token" }), cache: "no-store",
  });
  const data = await response.json() as { access_token?: string; expires_in?: number; error_description?: string };
  if (!response.ok || !data.access_token) throw new Error(data.error_description || "Google Analytics authentication failed.");
  tokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
  return tokenCache.token;
}

async function report(method: "runReport" | "runRealtimeReport", body: Record<string, unknown>) {
  const property = process.env.GOOGLE_ANALYTICS_PROPERTY_ID!.replace(/\D/g, "");
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:${method}`, {
    method: "POST", headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store",
  });
  const data = await response.json() as ApiReport & { error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message || "Google Analytics reporting request failed.");
  return data;
}

const n = (row: ApiRow, index: number) => Number(row.metricValues?.[index]?.value || 0);
const d = (row: ApiRow, index: number) => row.dimensionValues?.[index]?.value || "(not set)";

export async function getGoogleAnalyticsReport(from: string, to: string) {
  const configuration = googleAnalyticsConfiguration();
  if (!configuration.configured) throw new Error(`Google Analytics is not configured: ${configuration.missing.join(", ")}`);
  const dateRanges = [{ startDate: from, endDate: to }];
  const order = (metricName: string) => [{ metric: { metricName }, desc: true }];
  const [summary, geography, sources, pages, devices, bookings, realtime] = await Promise.all([
    report("runReport", { dateRanges, metrics: ["sessions","totalUsers","activeUsers","newUsers","screenPageViews","averageSessionDuration","bounceRate"].map(name=>({name})), metricAggregations:["TOTAL"] }),
    report("runReport", { dateRanges, dimensions:[{name:"country"},{name:"city"}], metrics:[{name:"sessions"},{name:"activeUsers"}], orderBys:order("sessions"), limit:15 }),
    report("runReport", { dateRanges, dimensions:[{name:"sessionDefaultChannelGroup"},{name:"sessionSource"},{name:"sessionMedium"}], metrics:[{name:"sessions"},{name:"activeUsers"}], orderBys:order("sessions"), limit:15 }),
    report("runReport", { dateRanges, dimensions:[{name:"pagePath"},{name:"pageTitle"}], metrics:[{name:"screenPageViews"},{name:"activeUsers"}], orderBys:order("screenPageViews"), limit:15 }),
    report("runReport", { dateRanges, dimensions:[{name:"deviceCategory"}], metrics:[{name:"sessions"},{name:"activeUsers"}], orderBys:order("sessions"), limit:10 }),
    report("runReport", { dateRanges, dimensions:[{name:"eventName"}], metrics:[{name:"eventCount"}], dimensionFilter:{filter:{fieldName:"eventName",stringFilter:{matchType:"EXACT",value:"booking_complete"}}} }),
    report("runRealtimeReport", { metrics:[{name:"activeUsers"}], minuteRanges:[{name:"Last 30 minutes",startMinutesAgo:29,endMinutesAgo:0}], metricAggregations:["TOTAL"] }),
  ]);
  const total = summary.totals?.[0] || summary.rows?.[0] || {};
  const sessions = n(total,0); const bookingEvents = n(bookings.rows?.[0] || {},0);
  return {
    configured:true, from, to, timeZone:summary.metadata?.timeZone || "",
    summary:{sessions,users:n(total,1),activeUsers:n(total,2),newUsers:n(total,3),pageViews:n(total,4),averageSessionDuration:n(total,5),bounceRate:n(total,6),bookingEvents,bookingConversionRate:sessions?bookingEvents/sessions*100:0,liveUsers:n(realtime.totals?.[0]||realtime.rows?.[0]||{},0)},
    geography:(geography.rows||[]).map(row=>({country:d(row,0),city:d(row,1),sessions:n(row,0),users:n(row,1)})),
    sources:(sources.rows||[]).map(row=>({channel:d(row,0),source:d(row,1),medium:d(row,2),sessions:n(row,0),users:n(row,1)})),
    pages:(pages.rows||[]).map(row=>({path:d(row,0),title:d(row,1),views:n(row,0),users:n(row,1)})),
    devices:(devices.rows||[]).map(row=>({device:d(row,0),sessions:n(row,0),users:n(row,1)})),
  };
}
