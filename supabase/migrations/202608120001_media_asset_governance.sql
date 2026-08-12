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
  locale text not null check (locale in ('en', 'ar', 'de', 'ru', 'pl', 'zh')),
  alt_text text check (alt_text is null or length(alt_text) <= 300),
  caption text check (caption is null or length(caption) <= 500),
  primary key (asset_id, locale)
);

create table if not exists public.media_usages (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.media_assets(id) on delete restrict,
  owner_type text not null check (owner_type in ('tour', 'destination', 'category', 'blog', 'page', 'social')),
  owner_key text not null check (length(owner_key) between 1 and 200),
  role text not null check (role in ('featured', 'gallery', 'thumbnail', 'hero', 'social')),
  sort_order integer not null default 0 check (sort_order >= 0),
  crop_profile text check (crop_profile is null or length(crop_profile) <= 40),
  created_at timestamptz not null default now(),
  unique (asset_id, owner_type, owner_key, role)
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

create or replace function public.update_media_asset_atomic(
  p_asset_id uuid,
  p_updates jsonb,
  p_localizations jsonb default null,
  p_usages jsonb default null
) returns public.media_assets
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_asset public.media_assets;
  updated_asset public.media_assets;
begin
  if not public.admin_has_permission('content') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;
  select * into current_asset from public.media_assets where id = p_asset_id for update;
  if not found then
    raise exception 'Media asset not found' using errcode = 'P0002';
  end if;
  if p_updates is null or jsonb_typeof(p_updates) <> 'object' then
    raise exception 'Media updates must be a JSON object';
  end if;
  if exists (select 1 from jsonb_object_keys(p_updates) key where key not in (
    'storage_path', 'public_url', 'file_name', 'mime_type', 'alt_text', 'credit', 'source_url', 'creator',
    'license_type', 'license_url', 'attribution_text', 'attribution_required', 'rights_status', 'authenticity', 'focal_x', 'focal_y'
  )) then raise exception 'Unsupported media update field'; end if;

  if p_updates ? 'storage_path' and (length(btrim(coalesce(p_updates->>'storage_path', ''))) not between 1 and 500) then raise exception 'Invalid storage path'; end if;
  if p_updates ? 'public_url' and nullif(btrim(p_updates->>'public_url'), '') is not null and (length(p_updates->>'public_url') > 500 or (p_updates->>'public_url' !~ '^/' and p_updates->>'public_url' !~ '^https?://')) then raise exception 'Invalid public URL'; end if;
  if p_updates ? 'file_name' and length(btrim(coalesce(p_updates->>'file_name', ''))) not between 1 and 200 then raise exception 'Invalid file name'; end if;
  if p_updates ? 'mime_type' and p_updates->>'mime_type' is not null and length(p_updates->>'mime_type') > 100 then raise exception 'Invalid MIME type'; end if;
  if p_updates ? 'alt_text' and p_updates->>'alt_text' is not null and length(p_updates->>'alt_text') > 300 then raise exception 'Alternative text is too long'; end if;
  if p_updates ? 'credit' and p_updates->>'credit' is not null and length(p_updates->>'credit') > 200 then raise exception 'Credit is too long'; end if;
  if p_updates ? 'creator' and p_updates->>'creator' is not null and length(p_updates->>'creator') > 200 then raise exception 'Creator is too long'; end if;
  if p_updates ? 'license_type' and p_updates->>'license_type' is not null and length(p_updates->>'license_type') > 100 then raise exception 'License type is too long'; end if;
  if p_updates ? 'attribution_text' and p_updates->>'attribution_text' is not null and length(p_updates->>'attribution_text') > 500 then raise exception 'Attribution is too long'; end if;
  if p_updates ? 'source_url' and nullif(btrim(p_updates->>'source_url'), '') is not null and (length(p_updates->>'source_url') > 1000 or p_updates->>'source_url' !~ '^https?://') then raise exception 'Invalid source URL'; end if;
  if p_updates ? 'license_url' and nullif(btrim(p_updates->>'license_url'), '') is not null and (length(p_updates->>'license_url') > 1000 or p_updates->>'license_url' !~ '^https?://') then raise exception 'Invalid license URL'; end if;
  if p_updates ? 'rights_status' and coalesce(p_updates->>'rights_status', '') not in ('unverified', 'owned', 'licensed', 'open-license', 'generated', 'restricted') then raise exception 'Invalid rights status'; end if;
  if p_updates ? 'authenticity' and coalesce(p_updates->>'authenticity', '') not in ('unknown', 'daily-red-sea', 'customer', 'supplier', 'stock', 'generated') then raise exception 'Invalid authenticity status'; end if;
  if p_updates ? 'attribution_required' and jsonb_typeof(p_updates->'attribution_required') <> 'boolean' then raise exception 'Attribution required must be boolean'; end if;
  if p_updates ? 'focal_x' and (jsonb_typeof(p_updates->'focal_x') <> 'number' or (p_updates->>'focal_x')::numeric not between 0 and 1) then raise exception 'Invalid horizontal focal point'; end if;
  if p_updates ? 'focal_y' and (jsonb_typeof(p_updates->'focal_y') <> 'number' or (p_updates->>'focal_y')::numeric not between 0 and 1) then raise exception 'Invalid vertical focal point'; end if;

  if p_localizations is not null then
    if jsonb_typeof(p_localizations) <> 'array' or jsonb_array_length(p_localizations) > 20 then
      raise exception 'Localizations must be an array with no more than 20 entries';
    end if;
    if exists (
      select 1 from jsonb_array_elements(p_localizations) item
      where coalesce(item->>'locale', '') not in ('en', 'ar', 'de', 'ru', 'pl', 'zh')
         or (item->>'alt_text' is not null and length(item->>'alt_text') > 300)
         or (item->>'caption' is not null and length(item->>'caption') > 500)
    ) then raise exception 'Invalid localized media metadata'; end if;
    if (select count(*) from jsonb_array_elements(p_localizations)) <> (select count(distinct item->>'locale') from jsonb_array_elements(p_localizations) item) then raise exception 'Duplicate localization locale'; end if;
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
      where coalesce(item->>'owner_type', '') not in ('tour', 'destination', 'category', 'blog', 'page', 'social')
         or coalesce(item->>'role', '') not in ('featured', 'gallery', 'thumbnail', 'hero', 'social')
         or length(btrim(coalesce(item->>'owner_key', ''))) not between 1 and 200
         or (item ? 'sort_order' and case
              when jsonb_typeof(item->'sort_order') <> 'number' or (item->>'sort_order') !~ '^[0-9]{1,10}$' then true
              else (item->>'sort_order')::numeric > 2147483647
            end)
         or (item->>'crop_profile' is not null and length(item->>'crop_profile') > 40)
    ) then raise exception 'Invalid media usage'; end if;
    if (select count(*) from jsonb_array_elements(p_usages)) <> (
      select count(distinct concat_ws(chr(31), item->>'owner_type', item->>'owner_key', item->>'role'))
      from jsonb_array_elements(p_usages) item
    ) then raise exception 'Duplicate media usage assignment'; end if;
    delete from public.media_usages where asset_id = p_asset_id;
    insert into public.media_usages (asset_id, owner_type, owner_key, role, sort_order, crop_profile)
      select p_asset_id, left(btrim(item->>'owner_type'), 40), left(btrim(item->>'owner_key'), 200), left(btrim(item->>'role'), 40),
        coalesce((item->>'sort_order')::integer, ordinal - 1), nullif(left(btrim(item->>'crop_profile'), 40), '')
      from jsonb_array_elements(p_usages) with ordinality as entry(item, ordinal);
  end if;

  update public.media_assets set
    storage_path = case when p_updates ? 'storage_path' then btrim(p_updates->>'storage_path') else current_asset.storage_path end,
    public_url = case when p_updates ? 'public_url' then nullif(btrim(p_updates->>'public_url'), '') else current_asset.public_url end,
    file_name = case when p_updates ? 'file_name' then btrim(p_updates->>'file_name') else current_asset.file_name end,
    mime_type = case when p_updates ? 'mime_type' then nullif(btrim(p_updates->>'mime_type'), '') else current_asset.mime_type end,
    alt_text = case when p_updates ? 'alt_text' then nullif(btrim(p_updates->>'alt_text'), '') else current_asset.alt_text end,
    credit = case when p_updates ? 'credit' then nullif(btrim(p_updates->>'credit'), '') else current_asset.credit end,
    source_url = case when p_updates ? 'source_url' then nullif(btrim(p_updates->>'source_url'), '') else current_asset.source_url end,
    creator = case when p_updates ? 'creator' then nullif(btrim(p_updates->>'creator'), '') else current_asset.creator end,
    license_type = case when p_updates ? 'license_type' then nullif(btrim(p_updates->>'license_type'), '') else current_asset.license_type end,
    license_url = case when p_updates ? 'license_url' then nullif(btrim(p_updates->>'license_url'), '') else current_asset.license_url end,
    attribution_text = case when p_updates ? 'attribution_text' then nullif(btrim(p_updates->>'attribution_text'), '') else current_asset.attribution_text end,
    attribution_required = case when p_updates ? 'attribution_required' then (p_updates->>'attribution_required')::boolean else current_asset.attribution_required end,
    rights_status = case when p_updates ? 'rights_status' then p_updates->>'rights_status' else current_asset.rights_status end,
    authenticity = case when p_updates ? 'authenticity' then p_updates->>'authenticity' else current_asset.authenticity end,
    focal_x = case when p_updates ? 'focal_x' then (p_updates->>'focal_x')::numeric else current_asset.focal_x end,
    focal_y = case when p_updates ? 'focal_y' then (p_updates->>'focal_y')::numeric else current_asset.focal_y end
  where id = p_asset_id returning * into updated_asset;
  return updated_asset;
end;
$$;

revoke all on function public.update_media_asset_atomic(uuid, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.update_media_asset_atomic(uuid, jsonb, jsonb, jsonb) to authenticated, service_role;
