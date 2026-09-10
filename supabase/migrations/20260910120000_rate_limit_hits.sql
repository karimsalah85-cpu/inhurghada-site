-- Cross-instance fixed-window rate limiting. lib/rate-limit.ts previously kept
-- counters in a per-instance in-memory Map, which a serverless cold start wipes
-- and which a caller spread across instances sidesteps entirely — so the admin
-- login / password-reset throttles were effectively advisory. This table plus
-- the atomic RPC below give every instance one shared counter per bucket.

create table if not exists public.rate_limit_hits (
  bucket text primary key,
  count integer not null default 0,
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.rate_limit_hits enable row level security;

-- Only the service role (via the RPC, which bypasses RLS) ever touches this.
-- No policies for anon/authenticated: the table holds raw client IPs.
revoke all on public.rate_limit_hits from public, anon, authenticated;

-- One atomic upsert: start (or restart, if the window elapsed) the window at
-- count 1, otherwise increment. Returns whether this hit is within `p_limit`
-- and, if not, how many seconds until the window resets.
create or replace function public.hit_rate_limit(p_bucket text, p_limit integer, p_window_seconds integer)
returns table(allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_count integer;
  v_reset timestamptz;
begin
  insert into public.rate_limit_hits as r (bucket, count, reset_at, updated_at)
  values (p_bucket, 1, v_now + make_interval(secs => p_window_seconds), v_now)
  on conflict (bucket) do update
    set count = case when r.reset_at <= v_now then 1 else r.count + 1 end,
        reset_at = case when r.reset_at <= v_now then v_now + make_interval(secs => p_window_seconds) else r.reset_at end,
        updated_at = v_now
  returning r.count, r.reset_at into v_count, v_reset;

  if v_count > p_limit then
    return query select false, greatest(0, ceil(extract(epoch from (v_reset - v_now))))::integer;
  else
    return query select true, 0;
  end if;
end;
$$;

revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;

-- Opportunistic housekeeping: drop windows that elapsed over a day ago. Cheap to
-- call from the daily admin-automation cron; harmless if never called.
create or replace function public.prune_rate_limit_hits()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.rate_limit_hits where reset_at < now() - interval '1 day';
$$;

revoke all on function public.prune_rate_limit_hits() from public, anon, authenticated;
grant execute on function public.prune_rate_limit_hits() to service_role;

notify pgrst, 'reload schema';
