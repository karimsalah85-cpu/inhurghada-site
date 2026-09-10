import { createAdminClient } from "@/utils/supabase/admin";

type RateLimitEntry = { count: number; resetAt: number };

const entries = new Map<string, RateLimitEntry>();

/**
 * In-process fixed-window limiter. Fast and dependency-free, but each serverless
 * instance keeps its own counter and a cold start wipes it, so a determined
 * caller spread across instances gets far more than `limit` attempts. Use it
 * only for best-effort spam damping; for anything guarding credentials or money
 * use {@link rateLimitShared}.
 */
export function rateLimit(key: string, limit = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const current = entries.get(key);
  if (!current || current.resetAt <= now) {
    entries.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= limit) return { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Cross-instance fixed-window limiter backed by a single atomic Postgres RPC
 * (`hit_rate_limit`), so the count is shared by every serverless instance and
 * survives cold starts. Falls back to the in-process {@link rateLimit} when the
 * service credentials are absent or the RPC fails, so a database blip degrades
 * to best-effort rather than locking users out or throwing.
 */
export async function rateLimitShared(key: string, limit = 5, windowMs = 15 * 60 * 1000) {
  const client = createAdminClient();
  if (!client) return rateLimit(key, limit, windowMs);
  try {
    const { data, error } = await client.rpc("hit_rate_limit", {
      p_bucket: key,
      p_limit: limit,
      p_window_seconds: Math.ceil(windowMs / 1000),
    });
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) return rateLimit(key, limit, windowMs);
    return { allowed: Boolean(row.allowed), retryAfterSeconds: Number(row.retry_after_seconds || 0) };
  } catch {
    return rateLimit(key, limit, windowMs);
  }
}
