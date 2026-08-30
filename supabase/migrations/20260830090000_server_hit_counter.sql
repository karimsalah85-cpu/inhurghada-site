-- Server-side page-view counter. A consent-independent sanity check that runs in
-- proxy.ts (Node runtime) on every real document navigation and increments a
-- per-day tally. It is deliberately raw: it counts bots and does not deduplicate
-- visitors, so it is only useful as a floor to compare against GA4 — if GA4 is
-- far below this, GA4 is silently dropping traffic (consent, blockers, tagging).

create table if not exists public.server_hit_days (
  day date primary key,
  hits bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.server_hit_days enable row level security;

-- Admins read the tally from /api/admin/server-hits. The writer is the service
-- role (via the RPC below), which bypasses RLS.
drop policy if exists "Admins read server hit days" on public.server_hit_days;
create policy "Admins read server hit days" on public.server_hit_days
  for select to authenticated using (public.is_daily_red_sea_admin());

revoke all on public.server_hit_days from public, anon, authenticated;
grant select on public.server_hit_days to authenticated;

-- Atomic increment for "today" in the business timezone (Africa/Cairo), so the
-- day buckets line up with the GA4 property timezone and the admin date pickers.
create or replace function public.record_server_hit()
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.server_hit_days (day, hits, updated_at)
  values ((now() at time zone 'Africa/Cairo')::date, 1, now())
  on conflict (day) do update
    set hits = public.server_hit_days.hits + 1,
        updated_at = now();
$$;

revoke all on function public.record_server_hit() from public, anon, authenticated;
grant execute on function public.record_server_hit() to service_role;

notify pgrst, 'reload schema';
