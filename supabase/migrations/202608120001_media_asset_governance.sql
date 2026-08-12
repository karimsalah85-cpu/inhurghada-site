alter table public.media_assets
  add column if not exists source_url text,
  add column if not exists creator text,
  add column if not exists license_type text,
  add column if not exists license_url text,
  add column if not exists attribution_text text,
  add column if not exists attribution_required boolean not null default false,
  add column if not exists rights_status text not null default 'unverified',
  add column if not exists authenticity text not null default 'unknown',
  add column if not exists verified_at timestamptz,
  add column if not exists checksum_sha256 text,
  add column if not exists focal_x numeric(5,4) not null default 0.5,
  add column if not exists focal_y numeric(5,4) not null default 0.5,
  add column if not exists archived_at timestamptz;

do $$ begin
  alter table public.media_assets add constraint media_assets_rights_status_check
    check (rights_status in ('unverified', 'owned', 'licensed', 'open-license', 'generated', 'restricted'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.media_assets add constraint media_assets_authenticity_check
    check (authenticity in ('unknown', 'daily-red-sea', 'customer', 'supplier', 'stock', 'generated'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.media_assets add constraint media_assets_focal_point_check
    check (focal_x between 0 and 1 and focal_y between 0 and 1);
exception when duplicate_object then null; end $$;

create table if not exists public.media_asset_localizations (
  asset_id uuid not null references public.media_assets(id) on delete cascade,
  locale text not null,
  alt_text text,
  caption text,
  primary key (asset_id, locale)
);

create table if not exists public.media_usages (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.media_assets(id) on delete restrict,
  owner_type text not null,
  owner_key text not null,
  role text not null,
  sort_order integer not null default 0,
  crop_profile text,
  created_at timestamptz not null default now(),
  unique (asset_id, owner_type, owner_key, role, sort_order)
);

alter table public.media_asset_localizations enable row level security;
alter table public.media_usages enable row level security;

drop policy if exists "admins manage media localizations" on public.media_asset_localizations;
create policy "admins manage media localizations" on public.media_asset_localizations
  for all using (public.is_daily_red_sea_admin()) with check (public.is_daily_red_sea_admin());

drop policy if exists "admins manage media usages" on public.media_usages;
create policy "admins manage media usages" on public.media_usages
  for all using (public.is_daily_red_sea_admin()) with check (public.is_daily_red_sea_admin());

create index if not exists media_usages_asset_id_idx on public.media_usages(asset_id);
create index if not exists media_usages_owner_idx on public.media_usages(owner_type, owner_key);

comment on table public.media_usages is 'Authoritative references used to prevent deletion of media that remains in use.';
comment on column public.media_assets.rights_status is 'Publication rights workflow; unverified assets must not be represented as cleared.';
