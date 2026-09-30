import AdminPageFrame from "@/components/admin/AdminPageFrame";
import { requireAdminPage } from "@/lib/admin-page-auth";
import { integrationStatuses, type CheckStatus, type HealthCheckRow, type RecordedCheck } from "@/lib/admin-integrations";

export const dynamic = "force-dynamic";

const checkStyles: Record<CheckStatus, string> = {
  ok: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-900",
  failed: "bg-red-100 text-red-800",
};
const checkLabels: Record<CheckStatus, string> = { ok: "OK", warning: "Warning", failed: "Failed" };

const formatCheckedAt = (value: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default async function IntegrationsPage() {
  const { supabase } = await requireAdminPage("settings");
  // Only previously recorded results are read here; this page never calls external services.
  const [healthResult, backupResult] = await Promise.all([
    supabase.from("system_health_checks").select("check_type,status,summary,checked_at").order("checked_at", { ascending: false }).limit(50),
    supabase.from("backup_checks").select("status,summary,checked_at").order("checked_at", { ascending: false }).limit(5),
  ]);
  const checksUnavailable = Boolean(healthResult.error || backupResult.error);
  const statuses = integrationStatuses((healthResult.data ?? []) as HealthCheckRow[], (backupResult.data ?? []) as RecordedCheck[]);

  return <AdminPageFrame eyebrow="System & access" title="Integrations" description="Which credentials are configured for this environment, and the last result the daily automation recorded where one exists. Credentials remain in protected deployment variables and are never displayed here.">
    <div className="grid gap-4 md:grid-cols-2">{statuses.map((integration) => (
      <article key={integration.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-black text-slate-900">{integration.name}</h2>
          <span className={`rounded-full px-3 py-1 text-xs font-black ${integration.configured ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>{integration.configured ? "Configured" : "Needs configuration"}</span>
        </div>
        <p className="mt-2 text-sm text-slate-600">{integration.description}</p>
        <p className="mt-3 text-sm text-slate-500">{integration.configured ? "Required variables are set. This does not prove the credentials work." : <>Missing: {integration.missing.map((key, index) => <span key={key}>{index ? ", " : ""}<code className="text-xs">{key}</code></span>)}</>}</p>
        {integration.hasCheckSource ? (
          <div className="mt-3 border-t border-slate-100 pt-3 text-sm">
            {integration.lastCheck ? (
              <>
                <p className="flex flex-wrap items-center gap-2 text-slate-600"><span className="font-semibold">{integration.checkLabel}:</span><span className={`rounded-full px-2 py-0.5 text-xs font-black ${checkStyles[integration.lastCheck.status] ?? checkStyles.warning}`}>{checkLabels[integration.lastCheck.status] ?? integration.lastCheck.status}</span><time dateTime={integration.lastCheck.checked_at}>{formatCheckedAt(integration.lastCheck.checked_at)}</time></p>
                {integration.lastCheck.summary ? <p className="mt-1 text-slate-500">{integration.lastCheck.summary}</p> : null}
              </>
            ) : <p className="text-slate-500">{checksUnavailable ? "Recorded checks could not be loaded." : "No automated check has been recorded yet."}</p>}
          </div>
        ) : null}
      </article>
    ))}</div>
    <p className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">Google Ads Basic Access is approved for Daily Red Sea as an advertiser using an internal reporting tool. This integration is read-only and must not create, edit, pause, or publish campaigns.</p>
  </AdminPageFrame>;
}
