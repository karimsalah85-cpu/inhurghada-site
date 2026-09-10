import "server-only";

// Editor-managed redirects (public.redirect_rules) are looked up on every real
// public navigation in proxy.ts. Without caching that is one Supabase round-trip
// added to the latency of every page view, and the overwhelmingly common answer
// is "no rule for this path". A short-lived in-process cache — negative results
// included — collapses that to at most one lookup per path per TTL per instance,
// while still picking up a newly published redirect within a minute.
//
// Uses the Supabase REST API directly (same style as server-hit-counter.ts) so
// it works regardless of the proxy runtime and pulls in no client library.

export type RedirectRule = { destination_path: string; permanent: boolean };

type CacheEntry = { rule: RedirectRule | null; expiresAt: number };

const TTL_MS = 60_000;
const MAX_ENTRIES = 1000;
const cache = new Map<string, CacheEntry>();

export function clearRedirectRuleCache() {
  cache.clear();
}

export async function lookupRedirectRule(pathname: string): Promise<RedirectRule | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  const now = Date.now();
  const cached = cache.get(pathname);
  if (cached && cached.expiresAt > now) return cached.rule;

  try {
    const query = new URLSearchParams({
      select: "destination_path,permanent",
      active: "eq.true",
      source_path: `eq.${pathname}`,
      limit: "1",
    });
    const response = await fetch(`${url}/rest/v1/redirect_rules?${query}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: "no-store",
    });
    if (!response.ok) return cached?.rule ?? null;
    const [row] = (await response.json()) as RedirectRule[];
    const rule = row?.destination_path ? { destination_path: row.destination_path, permanent: Boolean(row.permanent) } : null;
    if (cache.size >= MAX_ENTRIES) cache.clear();
    cache.set(pathname, { rule, expiresAt: now + TTL_MS });
    return rule;
  } catch (error) {
    console.error("Redirect lookup failed", error);
    return cached?.rule ?? null;
  }
}
