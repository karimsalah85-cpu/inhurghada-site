import AdminPageFrame from "@/components/admin/AdminPageFrame";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function EnvironmentsPage() {
  await requireAdminPage("settings");
  const source = process.env.APP_ENV ? "APP_ENV" : process.env.VERCEL_ENV ? "VERCEL_ENV" : "NODE_ENV";
  const raw = process.env.APP_ENV || process.env.VERCEL_ENV || process.env.NODE_ENV || "development";
  const live = ["production", "live"].includes(raw.toLowerCase());
  const projectRefConfigured = Boolean(process.env.SUPABASE_PROJECT_REF || process.env.NEXT_PUBLIC_SUPABASE_URL);
  return <AdminPageFrame eyebrow="System & access" title="Environment" description="A persistent badge in the admin navigation shows whether this deployment is operating as Test or Live."><div className="grid gap-4 md:grid-cols-2"><article className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm font-bold text-slate-500">Active environment</p><p className={`mt-3 inline-flex rounded-full px-4 py-2 text-sm font-black uppercase ${live ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>{live ? "Live" : "Test"}</p><p className="mt-4 text-sm text-slate-600">Detected from <code>{source}</code>. Set <code>APP_ENV</code> explicitly to <code>test</code> or <code>live</code> for the clearest source of truth.</p></article><article className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm font-bold text-slate-500">Database configuration</p><p className="mt-3 text-lg font-black">{projectRefConfigured ? "Supabase configured" : "Supabase not detected"}</p><p className="mt-4 text-sm leading-6 text-slate-600">The repository cannot prove that Test and Live use different Supabase projects. Confirm separate project URLs in Vercel before editing test data.</p></article></div></AdminPageFrame>;
}
