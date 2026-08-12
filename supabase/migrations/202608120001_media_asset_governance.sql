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

create or replace function public.replace_media_governance(
  p_asset_id uuid,
  p_localizations jsonb default null,
  p_usages jsonb default null
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.admin_has_permission('content') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;
  if not exists (select 1 from public.media_assets where id = p_asset_id) then
    raise exception 'Media asset not found' using errcode = 'P0002';
  end if;

  if p_localizations is not null then
    if jsonb_typeof(p_localizations) <> 'array' or jsonb_array_length(p_localizations) > 20 then
      raise exception 'Localizations must be an array with no more than 20 entries';
    end if;
    if exists (
      select 1 from jsonb_array_elements(p_localizations) item
      where length(btrim(coalesce(item->>'locale', ''))) not between 1 and 8
    ) then raise exception 'Every localization needs a valid locale'; end if;
    delete from public.media_asset_localizations where asset_id = p_asset_id;
    insert into public.media_asset_localizations (asset_id, locale, alt_text, caption)
      select p_asset_id, left(btrim(item->>'locale'), 8), nullif(left(btrim(item->>'alt_text'), 300), ''), nullif(left(btrim(item->>'caption'), 500), '')
      from jsonb_array_elements(p_localizations) item;
  end if;

  if p_usages is not null then
    if jsonb_typeof(p_usages) <> 'array' or jsonb_array_length(p_usages) > 100 then
      raise exception 'Usages must be an array with no more than 100 entries';
    end if;
    if exists (
      select 1 from jsonb_array_elements(p_usages) item
      where btrim(coalesce(item->>'owner_type', '')) = ''
         or btrim(coalesce(item->>'owner_key', '')) = ''
         or btrim(coalesce(item->>'role', '')) = ''
    ) then raise exception 'Every usage needs an owner type, owner key, and role'; end if;
    delete from public.media_usages where asset_id = p_asset_id;
    insert into public.media_usages (asset_id, owner_type, owner_key, role, sort_order, crop_profile)
      select p_asset_id, left(btrim(item->>'owner_type'), 40), left(btrim(item->>'owner_key'), 200), left(btrim(item->>'role'), 40),
        coalesce((item->>'sort_order')::integer, ordinal - 1), nullif(left(btrim(item->>'crop_profile'), 40), '')
      from jsonb_array_elements(p_usages) with ordinality as entry(item, ordinal);
  end if;
end;
$$;

revoke all on function public.replace_media_governance(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.replace_media_governance(uuid, jsonb, jsonb) to authenticated, service_role;
