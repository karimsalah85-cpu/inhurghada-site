-- Hotels and pickup zones: a master list of hotels, each placed in a pickup
-- zone, and a standard pickup time per zone per tour. The pickup manifest and
-- the pickup reminder use it when no pickup time was set on the booking's
-- assignment:
--   assignment pickup_time -> zone pickup time (hotel's zone, tour) -> booking start_time
--
-- Bookings keep their free-text `hotel`; the application matches it to a
-- hotel by `normalized_name` or by one of the `aliases` (see
-- lib/pickup-zones.ts, which also computes `normalized_name`).
--
-- Additive only: no existing table is changed.

create table if not exists public.pickup_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(btrim(name)) between 1 and 120),
  destination text not null default 'hurghada'
    check (destination in ('hurghada', 'marsa-alam', 'el-gouna', 'jeddah')),
  notes text check (notes is null or length(notes) <= 1000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 200),
  normalized_name text not null unique check (length(normalized_name) between 1 and 200),
  aliases text[] not null default '{}' check (cardinality(aliases) <= 30),
  zone_id uuid references public.pickup_zones(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hotels_zone_idx on public.hotels (zone_id);

create table if not exists public.zone_pickup_times (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.pickup_zones(id) on delete cascade,
  tour_slug text not null check (length(tour_slug) between 1 and 160),
  pickup_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (zone_id, tour_slug)
);
create index if not exists zone_pickup_times_tour_idx on public.zone_pickup_times (tour_slug);

alter table public.pickup_zones enable row level security;
alter table public.hotels enable row level security;
alter table public.zone_pickup_times enable row level security;

-- Any admin can read (the manifest and booking views show zones); only staff
-- with the operations permission can change the lists. Admin routes also
-- record every change with record_admin_audit.
do $$
declare table_name text;
begin
  foreach table_name in array array['pickup_zones', 'hotels', 'zone_pickup_times'] loop
    execute format('drop policy if exists "Admins read %s" on public.%I', table_name, table_name);
    execute format('create policy "Admins read %s" on public.%I for select to authenticated using (public.is_daily_red_sea_admin())', table_name, table_name);
    execute format('drop policy if exists "Operations manages %s" on public.%I', table_name, table_name);
    execute format('create policy "Operations manages %s" on public.%I for all to authenticated using (public.admin_has_permission(''operations'')) with check (public.admin_has_permission(''operations''))', table_name, table_name);
  end loop;
end $$;

revoke all on public.pickup_zones, public.hotels, public.zone_pickup_times from public, anon;
grant select, insert, update, delete on public.pickup_zones, public.hotels, public.zone_pickup_times to authenticated;
-- The daily automation (pickup reminders) reads these with the service role.
grant select on public.pickup_zones, public.hotels, public.zone_pickup_times to service_role;
