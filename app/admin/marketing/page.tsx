import Link from "next/link";
import { redirect } from "next/navigation";
import GoogleAdsPanel from "@/components/admin/GoogleAdsPanel";
import GoogleAnalyticsPanel from "@/components/admin/GoogleAnalyticsPanel";
import { hasAdminPermission, isAuthorizedAdmin } from "@/lib/admin-auth";
import { createClient } from "@/utils/supabase/server";

export default async function AdminMarketingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) redirect("/admin/login");
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2") redirect("/admin/mfa");
  if (!hasAdminPermission(user, "finance") && !hasAdminPermission(user, "reports")) redirect("/admin");

  return <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-10">
    <div className="mx-auto max-w-7xl">
      <header className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">Marketing intelligence</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Analytics & advertising</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Website audiences and Google Ads performance in one stable workspace.</p>
          </div>
          <Link href="/admin" className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-bold hover:border-white hover:bg-white hover:text-slate-950">Back to operations</Link>
        </div>
      </header>
      <GoogleAnalyticsPanel />
      <GoogleAdsPanel />
    </div>
  </main>;
}
