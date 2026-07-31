-- Complete Daily Red Sea operations: capacity protection, CRM, supplier ledger,
-- communications, SEO monitoring, staff permissions, and backup verification.

alter table public.bookings
  add column if not exists tour_slug text,
  add column if not exists start_time time,
  add column if not exists adults integer not null default 0 check (adults >= 0),
  add column if not exists youth integer not null default 0 check (youth >= 0),
  add column if not exists infants integer not null default 0 check (infants >= 0),
  add column if not exists locale text not null default 'en';

alter table public.suppliers
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists contract_url text,
  add column if not exists default_currency text not null default 'USD',
  add column if not exists active boolean not null default true;

alter table public.expenses add column if not exists external_reference text;
create unique index if not exists expenses_external_reference_unique on public.expenses(external_reference) where external_reference is not null;

create table if not exists public.supplier_prices (
  id uuid primary key default gen_random_uuid(), supplier_id uuid not null references public.suppliers(id) on delete cascade,
  tour_slug text not null, adult_cost numeric(12,2) not null default 0 check (adult_cost >= 0),
  youth_cost numeric(12,2) check (youth_cost is null or youth_cost >= 0), fixed_cost numeric(12,2) check (fixed_cost is null or fixed_cost >= 0),
  currency text not null default 'USD', valid_from date, valid_to date, notes text, created_at timestamptz not null default now(),
  unique (supplier_id, tour_slug, valid_from)
);

create table if not exists public.supplier_payments (
  id uuid primary key default gen_random_uuid(), supplier_id uuid not null references public.suppliers(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null, amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'USD', status text not null default 'owed' check (status in ('owed','scheduled','paid','disputed')),
  due_date date, paid_at timestamptz, reference text, notes text, created_at timestamptz not null default now()
);

create table if not exists public.customer_profiles (
  id uuid primary key default gen_random_uuid(), customer_key text unique not null, name text, email text, phone text,
  preferred_language text default 'en', preferences text, tags text[] not null default '{}', last_booking_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.communication_messages (
  id uuid primary key default gen_random_uuid(), booking_id uuid references public.bookings(id) on delete set null,
  customer_key text, channel text not null check (channel in ('email','whatsapp')), direction text not null check (direction in ('inbound','outbound')),
  recipient text, sender text, subject text, body text not null, provider_message_id text, delivery_status text not null default 'recorded',
  occurred_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.booking_capacity_reservations (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete cascade,
  availability_id uuid not null references public.tour_availability(id) on delete restrict, places integer not null check (places > 0),
  released_at timestamptz, created_at timestamptz not null default now(), unique (booking_id, availability_id)
);

create table if not exists public.seo_checks (
  id bigint generated always as identity primary key, check_type text not null check (check_type in ('sitemap','broken_link','search_console')),
  url text, status text not null check (status in ('ok','warning','failed')), status_code integer, summary text not null,
  details jsonb, checked_at timestamptz not null default now()
);

create table if not exists public.backup_checks (
  id bigint generated always as identity primary key, backup_type text not null default 'supabase', status text not null check (status in ('ok','warning','failed')),
  backup_created_at timestamptz, restore_verified_at timestamptz, summary text not null, details jsonb, checked_at timestamptz not null default now()
);

create index if not exists bookings_customer_email_idx on public.bookings (lower(customer_email));
create index if not exists bookings_phone_idx on public.bookings (phone);
create index if not exists bookings_tour_date_idx on public.bookings (tour_slug, date, status);
create index if not exists supplier_payments_status_idx on public.supplier_payments (supplier_id, status, due_date);
create index if not exists communication_messages_customer_idx on public.communication_messages (customer_key, occurred_at desc);

alter table public.supplier_prices enable row level security;
alter table public.supplier_payments enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.communication_messages enable row level security;
alter table public.booking_capacity_reservations enable row level security;
alter table public.seo_checks enable row level security;
alter table public.backup_checks enable row level security;

do $$ declare table_name text; begin
  foreach table_name in array array['supplier_prices','supplier_payments','customer_profiles','communication_messages','booking_capacity_reservations','seo_checks','backup_checks'] loop
    begin
      execute format('create policy "Authorized admin manages %s" on public.%I for all to authenticated using (public.is_daily_red_sea_admin()) with check (public.is_daily_red_sea_admin())', table_name, table_name);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

drop policy if exists "Authorized admin manages admin_profiles" on public.admin_profiles;
create policy "Owner manages admin profiles" on public.admin_profiles for all to authenticated using (public.admin_has_permission('staff')) with check (public.admin_has_permission('staff'));
create policy "Staff reads own profile" on public.admin_profiles for select to authenticated using (id=auth.uid());

drop policy if exists "Authorized admin manages site_settings" on public.site_settings;
create policy "Manager manages site settings" on public.site_settings for all to authenticated using (public.admin_has_permission('settings')) with check (public.admin_has_permission('settings'));

drop policy if exists "Authorized admin manages admin_audit_log" on public.admin_audit_log;
create policy "Admins read audit log" on public.admin_audit_log for select to authenticated using (public.is_daily_red_sea_admin());

drop policy if exists "Authorized admin manages system_health_checks" on public.system_health_checks;
create policy "Managers read system health" on public.system_health_checks for select to authenticated using (public.admin_has_permission('settings'));

drop policy if exists "Authorized admin manages seo_checks" on public.seo_checks;
create policy "Managers read SEO checks" on public.seo_checks for select to authenticated using (public.admin_has_permission('settings'));
drop policy if exists "Authorized admin manages backup_checks" on public.backup_checks;
create policy "Managers read backup checks" on public.backup_checks for select to authenticated using (public.admin_has_permission('settings'));
create policy "Managers record backup checks" on public.backup_checks for insert to authenticated with check (public.admin_has_permission('settings'));

create or replace function public.reserve_booking(
  p_reference text, p_type text, p_customer_name text, p_customer_email text, p_phone text,
  p_tour_name text, p_tour_slug text, p_date date, p_start_time time, p_guests integer,
  p_adults integer, p_youth integer, p_infants integer, p_hotel text, p_notes text,
  p_amount numeric, p_currency text, p_locale text
) returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare slot public.tour_availability; created public.bookings;
begin
  if p_guests < 1 then raise exception using errcode = '22023', message = 'At least one guest is required.'; end if;
  select * into slot from public.tour_availability
  where tour_slug = p_tour_slug and service_date = p_date
    and (start_time is null or p_start_time is null or start_time = p_start_time)
  order by (start_time = p_start_time) desc nulls last limit 1 for update;
  if found then
    if slot.blocked then raise exception using errcode = 'P0001', message = 'This date is sold out.'; end if;
    if slot.capacity is not null and slot.reserved + p_guests > slot.capacity then
      raise exception using errcode = 'P0001', message = format('Only %s places remain.', greatest(slot.capacity - slot.reserved, 0));
    end if;
    update public.tour_availability set reserved = reserved + p_guests, updated_at = now() where id = slot.id;
  end if;
  insert into public.bookings (reference,type,customer_name,customer_email,phone,tour_name,tour_slug,date,start_time,guests,adults,youth,infants,hotel,notes,amount,currency,locale)
  values (p_reference,p_type,p_customer_name,lower(p_customer_email),p_phone,p_tour_name,p_tour_slug,p_date,p_start_time,p_guests,p_adults,p_youth,p_infants,p_hotel,p_notes,p_amount,p_currency,p_locale)
  returning * into created;
  insert into public.customer_profiles (customer_key,name,email,phone,preferred_language,last_booking_at)
  values (coalesce(nullif(lower(p_customer_email),''),p_phone),p_customer_name,lower(p_customer_email),p_phone,p_locale,now())
  on conflict (customer_key) do update set name=excluded.name,email=excluded.email,phone=excluded.phone,preferred_language=excluded.preferred_language,last_booking_at=now(),updated_at=now();
  return created;
end $$;

revoke all on function public.reserve_booking(text,text,text,text,text,text,text,date,time,integer,integer,integer,integer,text,text,numeric,text,text) from public, anon, authenticated;
grant execute on function public.reserve_booking(text,text,text,text,text,text,text,date,time,integer,integer,integer,integer,text,text,numeric,text,text) to service_role;

create or replace function public.reserve_multi_trip_booking(
  p_reference text, p_customer_name text, p_customer_email text, p_phone text, p_tour_name text,
  p_date date, p_guests integer, p_hotel text, p_notes text, p_amount numeric, p_currency text, p_locale text,
  p_items jsonb
) returns public.bookings language plpgsql security definer set search_path='' as $$
declare item jsonb; slot public.tour_availability; created public.bookings; requested integer; requested_time time;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then raise exception using errcode='22023',message='Trip items are required.'; end if;
  for item in select * from jsonb_array_elements(p_items) loop
    requested := greatest(1,(item->>'places')::integer);
    requested_time := case when coalesce(item->>'time','') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then (item->>'time')::time else null end;
    select * into slot from public.tour_availability where tour_slug=item->>'tour_slug' and service_date=(item->>'date')::date
      and (start_time is null or requested_time is null or start_time=requested_time)
      order by (start_time=requested_time) desc nulls last limit 1 for update;
    if found and (slot.blocked or (slot.capacity is not null and slot.reserved+requested>slot.capacity)) then
      raise exception using errcode='P0001',message=format('%s on %s has only %s places remaining.',item->>'tour_slug',item->>'date',greatest(coalesce(slot.capacity-slot.reserved,0),0));
    end if;
  end loop;
  created := public.reserve_booking(p_reference,'tour',p_customer_name,p_customer_email,p_phone,p_tour_name,'multi-trip',p_date,null,p_guests,0,0,0,p_hotel,p_notes,p_amount,p_currency,p_locale);
  for item in select * from jsonb_array_elements(p_items) loop
    requested := greatest(1,(item->>'places')::integer);
    requested_time := case when coalesce(item->>'time','') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then (item->>'time')::time else null end;
    select * into slot from public.tour_availability where tour_slug=item->>'tour_slug' and service_date=(item->>'date')::date
      and (start_time is null or requested_time is null or start_time=requested_time)
      order by (start_time=requested_time) desc nulls last limit 1 for update;
    if found then
      update public.tour_availability set reserved=reserved+requested,updated_at=now() where id=slot.id;
      insert into public.booking_capacity_reservations(booking_id,availability_id,places) values(created.id,slot.id,requested);
    end if;
  end loop;
  return created;
end $$;
revoke all on function public.reserve_multi_trip_booking(text,text,text,text,text,date,integer,text,text,numeric,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.reserve_multi_trip_booking(text,text,text,text,text,date,integer,text,text,numeric,text,text,jsonb) to service_role;

create or replace function public.release_booking_capacity() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (tg_op = 'DELETE' and old.status <> 'cancelled') or (tg_op = 'UPDATE' and old.status <> 'cancelled' and new.status = 'cancelled') then
    update public.tour_availability set reserved = greatest(0,reserved-old.guests), updated_at=now()
    where tour_slug=old.tour_slug and service_date=old.date and (start_time is null or old.start_time is null or start_time=old.start_time);
    update public.tour_availability a set reserved=greatest(0,a.reserved-r.places),updated_at=now()
      from public.booking_capacity_reservations r where r.booking_id=old.id and r.availability_id=a.id and r.released_at is null;
    update public.booking_capacity_reservations set released_at=now() where booking_id=old.id and released_at is null;
  elsif tg_op = 'UPDATE' and old.status = 'cancelled' and new.status <> 'cancelled' then
    if exists(select 1 from public.booking_capacity_reservations r join public.tour_availability a on a.id=r.availability_id where r.booking_id=new.id and r.released_at is not null and (a.blocked or (a.capacity is not null and a.reserved+r.places>a.capacity))) then
      raise exception using errcode='P0001',message='Not enough capacity to reactivate this multi-trip booking.';
    end if;
    update public.tour_availability set reserved=reserved+new.guests, updated_at=now()
    where tour_slug=new.tour_slug and service_date=new.date and not blocked and (capacity is null or reserved+new.guests<=capacity)
      and (start_time is null or new.start_time is null or start_time=new.start_time);
    if not found and exists(select 1 from public.tour_availability where tour_slug=new.tour_slug and service_date=new.date) then
      raise exception using errcode='P0001', message='Not enough capacity to reactivate this booking.';
    end if;
    update public.tour_availability a set reserved=a.reserved+r.places,updated_at=now()
      from public.booking_capacity_reservations r where r.booking_id=new.id and r.availability_id=a.id and r.released_at is not null;
    update public.booking_capacity_reservations set released_at=null where booking_id=new.id and released_at is not null;
  end if;
  return case when tg_op='DELETE' then old else new end;
end $$;

drop trigger if exists booking_capacity_release on public.bookings;
create trigger booking_capacity_release before update of status or delete on public.bookings for each row execute function public.release_booking_capacity();

create or replace view public.admin_customer_summary with (security_invoker=true) as
select coalesce(nullif(lower(customer_email),''),phone) customer_key, max(customer_name) customer_name,
  max(customer_email) customer_email, max(phone) phone, count(*) bookings,
  count(*) filter (where status <> 'cancelled') completed_or_active_bookings,
  coalesce(sum(amount) filter (where payment_status='paid'),0) total_spending,
  max(currency) currency, min(created_at) first_booking_at, max(created_at) last_booking_at
from public.bookings group by coalesce(nullif(lower(customer_email),''),phone);

grant select on public.admin_customer_summary to authenticated;

insert into public.site_settings(key,value,category,public,description) values
('phone_number','"+20 103 080 9150"'::jsonb,'contact',true,'Public telephone number'),
('whatsapp_number','"201030809150"'::jsonb,'contact',true,'Public WhatsApp number'),
('contact_email','"info@dailyredsea.com"'::jsonb,'contact',true,'Public contact email'),
('facebook_url','"https://www.facebook.com/profile.php?id=61592247695069"'::jsonb,'social',true,'Facebook profile'),
('instagram_url','"https://www.instagram.com/dailyredsea.com7/"'::jsonb,'social',true,'Instagram profile'),
('announcement','""'::jsonb,'promotion',true,'Temporary announcement banner text'),
('announcement_active','false'::jsonb,'promotion',true,'Show announcement banner'),
('cancellation_rules','"Free cancellation at least 24 hours before pickup unless tour-specific terms state otherwise."'::jsonb,'legal',true,'Default cancellation rule'),
('currency_rates','{"USD":1,"EUR":0.876691,"GBP":0.747063,"EGP":51.008475}'::jsonb,'currency',true,'Manual currency-rate overrides')
on conflict(key) do nothing;

create or replace function public.admin_has_permission(permission_name text)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.admin_profiles p where p.id=auth.uid() and p.active and (
    p.role='owner' or p.role='manager' or
    (p.role='operator' and permission_name in ('bookings','operations','communications')) or
    (p.role='content_editor' and permission_name='content') or
    (p.role='finance' and permission_name in ('finance','suppliers','reports'))
  )) or (lower(coalesce(auth.jwt()->>'email',''))='info@dailyredsea.com');
$$;
revoke all on function public.admin_has_permission(text) from public,anon;
grant execute on function public.admin_has_permission(text) to authenticated;

do $$ declare table_name text; begin
  foreach table_name in array array['bookings'] loop
    execute format('drop policy if exists "Authorized admin manages %s" on public.%I',table_name,table_name);
    execute format('create policy "Role manages %s" on public.%I for all to authenticated using (public.admin_has_permission(''bookings'')) with check (public.admin_has_permission(''bookings''))',table_name,table_name);
    execute format('create policy "Role reports %s" on public.%I for select to authenticated using (public.admin_has_permission(''reports''))',table_name,table_name);
  end loop;
  foreach table_name in array array['expenses','sales_people'] loop
    execute format('drop policy if exists "Authorized admin manages %s" on public.%I',table_name,table_name);
    execute format('create policy "Role manages %s" on public.%I for all to authenticated using (public.admin_has_permission(''finance'')) with check (public.admin_has_permission(''finance''))',table_name,table_name);
  end loop;
  foreach table_name in array array['suppliers','supplier_prices','supplier_payments'] loop
    execute format('drop policy if exists "Authorized admin manages %s" on public.%I',table_name,table_name);
    execute format('create policy "Role manages %s" on public.%I for all to authenticated using (public.admin_has_permission(''suppliers'')) with check (public.admin_has_permission(''suppliers''))',table_name,table_name);
  end loop;
  foreach table_name in array array['content_items','media_assets','redirect_rules'] loop
    execute format('drop policy if exists "Authorized admin manages %s" on public.%I',table_name,table_name);
    execute format('create policy "Role manages %s" on public.%I for all to authenticated using (public.admin_has_permission(''content'')) with check (public.admin_has_permission(''content''))',table_name,table_name);
  end loop;
  foreach table_name in array array['tour_availability','staff_members','booking_assignments','customer_notes','customer_profiles','booking_capacity_reservations'] loop
    execute format('drop policy if exists "Authorized admin manages %s" on public.%I',table_name,table_name);
    execute format('create policy "Role manages %s" on public.%I for all to authenticated using (public.admin_has_permission(''operations'')) with check (public.admin_has_permission(''operations''))',table_name,table_name);
  end loop;
  foreach table_name in array array['communication_templates','communication_queue','communication_messages'] loop
    execute format('drop policy if exists "Authorized admin manages %s" on public.%I',table_name,table_name);
    execute format('create policy "Role manages %s" on public.%I for all to authenticated using (public.admin_has_permission(''communications'')) with check (public.admin_has_permission(''communications''))',table_name,table_name);
  end loop;
end $$;
