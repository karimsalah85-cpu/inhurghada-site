import "server-only";

// Consent-independent, zero-dependency server-side page-view counter. Writes go
// through proxy.ts on real document navigations; reads are surfaced on
// /admin/analytics next to the GA4 numbers as a floor to compare against.
//
// Uses the Supabase REST API directly (same style as proxy.ts) so it works
// regardless of the proxy runtime and pulls in no client library.

const restBase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
};

const cairoDay = (date: Date) => date.toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });

function shiftDay(isoDay: string, deltaDays: number) {
  const base = new Date(`${isoDay}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + deltaDays);
  return base.toISOString().slice(0, 10);
}

/** Fire-and-forget: increments today's tally. Never throws. */
export async function recordServerHit(): Promise<void> {
  const config = restBase();
  if (!config) return;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    await fetch(`${config.url}/rest/v1/rpc/record_server_hit`, {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
      },
      body: "{}",
      cache: "no-store",
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
  } catch {
    // A dropped analytics ping must never affect the request it rode in on.
  }
}

export type ServerHitTotals =
  | { available: false }
  | { available: true; total: number; today: number; last7: number; last30: number; days: Array<{ day: string; hits: number }> };

/** Reads the tally for the admin panel. Degrades to { available: false } if the
 *  migration has not been applied yet. */
export async function getServerHitTotals(): Promise<ServerHitTotals> {
  const config = restBase();
  if (!config) return { available: false };
  try {
    const response = await fetch(`${config.url}/rest/v1/server_hit_days?select=day,hits&order=day.desc&limit=400`, {
      headers: { apikey: config.key, Authorization: `Bearer ${config.key}` },
      cache: "no-store",
    });
    if (!response.ok) return { available: false };
    const rows = (await response.json()) as Array<{ day: string; hits: number }>;
    const today = cairoDay(new Date());
    const from7 = shiftDay(today, -6);
    const from30 = shiftDay(today, -29);
    const sum = (predicate: (day: string) => boolean) =>
      rows.reduce((total, row) => (predicate(row.day) ? total + Number(row.hits || 0) : total), 0);
    return {
      available: true,
      total: sum(() => true),
      today: sum((day) => day === today),
      last7: sum((day) => day >= from7),
      last30: sum((day) => day >= from30),
      days: rows.slice(0, 30),
    };
  } catch {
    return { available: false };
  }
}
