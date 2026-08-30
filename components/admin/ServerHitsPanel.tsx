"use client";

import { useEffect, useState } from "react";
import { ServerCog } from "lucide-react";
import type { ServerHitTotals } from "@/lib/server-hit-counter";

export default function ServerHitsPanel() {
  const [data, setData] = useState<ServerHitTotals | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/server-hits", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("request failed"))))
      .then((result: ServerHitTotals) => { if (active) setData(result); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);

  return (
    <section id="server-side-hits" className="mt-8 scroll-mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <ServerCog className="mt-1 text-emerald-700" />
        <div>
          <h2 className="text-2xl font-bold">Server-side hits (raw, no consent-gating)</h2>
          <p className="mt-1 text-sm text-slate-500">
            Counted in the proxy on every real page navigation before any consent choice or ad-blocker
            applies. Includes bots and does not deduplicate visitors — use it as a floor to sanity-check
            the Google Analytics numbers above, not as a replacement.
          </p>
        </div>
      </div>

      {failed || (data && data.available === false) ? (
        <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          Not available yet. Apply the <code>server_hit_days</code> migration
          (<code>supabase db push</code>) and redeploy; counts start accumulating from the next page view.
        </p>
      ) : null}

      {data && data.available ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Today (Cairo)" value={data.today} />
          <Metric label="Last 7 days" value={data.last7} />
          <Metric label="Last 30 days" value={data.last30} />
          <Metric label="All time" value={data.total} />
        </div>
      ) : null}

      {!data && !failed ? <p role="status" className="mt-5 text-sm font-semibold text-emerald-700">Loading…</p> : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-emerald-50 p-4">
      <p className="text-xs font-bold text-emerald-700">{label}</p>
      <p className="mt-1 text-2xl font-black">{value.toLocaleString()}</p>
    </div>
  );
}
