import AdminPageFrame from "@/components/admin/AdminPageFrame";
import { requireAdminPage } from "@/lib/admin-page-auth";

const integrations = [
  { name: "Google Analytics", keys: ["GOOGLE_ANALYTICS_PROPERTY_ID", "GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN"] },
  { name: "Google Ads", keys: ["GOOGLE_ADS_CUSTOMER_ID", "GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN"] },
  { name: "Stripe payments", keys: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] },
  { name: "Email", keys: ["GMAIL_SMTP_APP_PASSWORD"] },
  { name: "WhatsApp", keys: ["TWILIO_WHATSAPP_FROM"] },
] as const;

export default async function IntegrationsPage() {
  await requireAdminPage("settings");
  return <AdminPageFrame eyebrow="System & access" title="Integrations" description="Connection health only. Credentials remain in protected deployment variables and are never displayed here."><div className="grid gap-4 md:grid-cols-2">{integrations.map((integration) => { const connected = integration.keys.every((key) => Boolean(process.env[key])); return <article key={integration.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-4"><h2 className="font-black text-slate-900">{integration.name}</h2><span className={`rounded-full px-3 py-1 text-xs font-black ${connected ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>{connected ? "Connected" : "Needs configuration"}</span></div><p className="mt-3 text-sm text-slate-500">{connected ? "Required credentials are configured." : "One or more required deployment variables are missing."}</p></article>; })}</div><p className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">Google Ads can be configured while still being restricted to test accounts. Production reporting requires Google to approve the developer token for Basic or Standard access.</p></AdminPageFrame>;
}
