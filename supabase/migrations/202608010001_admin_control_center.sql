-- Daily Red Sea admin control-center foundation.
-- Existing bookings, expenses, suppliers, and public content remain unchanged.

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  role text not null default 'operator' check (role in ('owner', 'manager', 'operator', 'content_editor', 'finance')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.admin_profiles (id, email, display_name, role)
select id, lower(email), coalesce(raw_user_meta_data ->> 'full_name', email), 'owner'
from auth.users
where lower(email) = 'info@dailyredsea.com'
on conflict (id) do update set role = 'owner', active = true;

create or replace function public.is_daily_red_sea_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_profiles profile
    where profile.id = auth.uid() and profile.active
  ) or lower(coalesce(auth.jwt() ->> 'email', '')) = 'info@dailyredsea.com';
$$;

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  resource_type text not null,
  resource_id text,
  summary text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('tour', 'blog', 'page', 'promotion')),
  slug text not null,
  locale text not null default 'en',
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'archived')),
  title text not null,
  excerpt text,
  body jsonb not null default '{}'::jsonb,
  seo_title text,
  seo_description text,
  canonical_path text,
  featured_image text,
  publish_at timestamptz,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_type, slug, locale)
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text unique not null,
  public_url text,
  file_name text not null,
  mime_type text,
  alt_text text,
  credit text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  width integer,
  height integer,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.tour_availability (
  id uuid primary key default gen_random_uuid(),
  tour_slug text not null,
  service_date date not null,
  start_time time,
  capacity integer check (capacity is null or capacity >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  blocked boolean not null default false,
  price_override numeric(12,2) check (price_override is null or price_override >= 0),
  currency text not null default 'USD',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tour_slug, service_date, start_time)
);

create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  staff_type text not null check (staff_type in ('guide', 'driver', 'crew', 'operations')),
  phone text,
  languages text[] not null default '{}',
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.booking_assignments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  staff_member_id uuid references public.staff_members(id) on delete set null,
  assignment_type text not null check (assignment_type in ('supplier', 'guide', 'driver', 'crew')),
  pickup_time timestamptz,
  internal_cost numeric(12,2) check (internal_cost is null or internal_cost >= 0),
  currency text not null default 'USD',
  status text not null default 'assigned' check (status in ('assigned', 'accepted', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_key text not null,
  customer_name text,
  note text not null,
  tags text[] not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.communication_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text not null check (channel in ('email', 'whatsapp')),
  event_key text not null,
  locale text not null default 'en',
  subject text,
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_key, channel, locale)
);

create table if not exists public.communication_queue (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  template_id uuid references public.communication_templates(id) on delete set null,
  channel text not null check (channel in ('email', 'whatsapp')),
  recipient text not null,
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  attempts integer not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  category text not null default 'general',
  public boolean not null default false,
  description text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.redirect_rules (
  id uuid primary key default gen_random_uuid(),
  source_path text unique not null check (source_path like '/%'),
  destination_path text not null,
  permanent boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_health_checks (
  id bigint generated always as identity primary key,
  check_type text not null check (check_type in ('database', 'backup', 'email', 'analytics', 'links')),
  status text not null check (status in ('ok', 'warning', 'failed')),
  summary text not null,
  details jsonb,
  checked_at timestamptz not null default now()
);

create index if not exists content_items_publish_idx on public.content_items (status, publish_at, content_type);
create index if not exists tour_availability_date_idx on public.tour_availability (service_date, tour_slug);
create index if not exists booking_assignments_booking_idx on public.booking_assignments (booking_id);
create index if not exists customer_notes_key_idx on public.customer_notes (customer_key, created_at desc);
create index if not exists communication_queue_schedule_idx on public.communication_queue (status, scheduled_for);
create index if not exists audit_log_created_idx on public.admin_audit_log (created_at desc);

alter table public.admin_profiles enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.content_items enable row level security;
alter table public.media_assets enable row level security;
alter table public.tour_availability enable row level security;
alter table public.staff_members enable row level security;
alter table public.booking_assignments enable row level security;
alter table public.customer_notes enable row level security;
alter table public.communication_templates enable row level security;
alter table public.communication_queue enable row level security;
alter table public.site_settings enable row level security;
alter table public.redirect_rules enable row level security;
alter table public.system_health_checks enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'admin_profiles', 'admin_audit_log', 'content_items', 'media_assets',
    'tour_availability', 'staff_members', 'booking_assignments', 'customer_notes',
    'communication_templates', 'communication_queue', 'site_settings',
    'redirect_rules', 'system_health_checks'
  ] loop
    execute format('drop policy if exists "Authorized admin manages %s" on public.%I', table_name, table_name);
    execute format('create policy "Authorized admin manages %s" on public.%I for all to authenticated using (public.is_daily_red_sea_admin()) with check (public.is_daily_red_sea_admin())', table_name, table_name);
  end loop;
end $$;

create or replace function public.record_admin_audit(
  action_name text,
  resource_name text,
  resource_identifier text,
  summary_text text,
  before_value jsonb default null,
  after_value jsonb default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.admin_audit_log (actor_id, actor_email, action, resource_type, resource_id, summary, before_data, after_data)
  select auth.uid(), lower(coalesce(auth.jwt() ->> 'email', '')), action_name, resource_name, resource_identifier, summary_text, before_value, after_value
  where public.is_daily_red_sea_admin();
$$;

revoke all on function public.record_admin_audit(text, text, text, text, jsonb, jsonb) from public, anon;
grant execute on function public.record_admin_audit(text, text, text, text, jsonb, jsonb) to authenticated;
