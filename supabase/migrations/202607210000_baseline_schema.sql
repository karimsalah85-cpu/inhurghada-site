-- Baseline schema predating the incremental migrations below. Keeping it in
-- migration history makes clean local and CI replay deterministic.
create type public.booking_status as enum ('new', 'confirmed', 'completed', 'cancelled');
create type public.payment_status as enum ('unpaid', 'paid', 'refunded');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  type text not null check (type in ('tour', 'transfer')),
  customer_name text not null,
  customer_email text,
  phone text not null,
  tour_name text,
  date date,
  guests integer,
  hotel text,
  notes text,
  amount numeric(12,2) not null default 0,
  currency text not null default 'USD',
  status public.booking_status not null default 'new',
  payment_status public.payment_status not null default 'unpaid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'USD',
  expense_date date not null default current_date,
  category text,
  expense_type text not null default 'other',
  created_at timestamptz not null default now()
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'other' check (type in ('boat', 'driver', 'guide', 'other')),
  contact_name text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.sales_people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  commission_percent numeric(5,2) check (commission_percent is null or (commission_percent >= 0 and commission_percent <= 100)),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.expenses
  add column supplier_id uuid references public.suppliers(id) on delete set null,
  add column sales_person_id uuid references public.sales_people(id) on delete set null,
  add column booking_id uuid references public.bookings(id) on delete set null;

create index if not exists expenses_booking_id_idx on public.expenses (booking_id);
create index if not exists expenses_supplier_id_idx on public.expenses (supplier_id);

alter table public.bookings
  add column sales_person_id uuid references public.sales_people(id) on delete set null,
  add column sales_commission_percent numeric(5,2)
    check (sales_commission_percent is null or (sales_commission_percent >= 0 and sales_commission_percent <= 100));

alter table public.bookings enable row level security;
alter table public.expenses enable row level security;
alter table public.suppliers enable row level security;
alter table public.sales_people enable row level security;

create or replace function public.is_daily_red_sea_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'info@dailyredsea.com';
$$;

revoke all on function public.is_daily_red_sea_admin() from public;
revoke all on function public.is_daily_red_sea_admin() from anon;
grant execute on function public.is_daily_red_sea_admin() to authenticated;

create policy "Authorized admin manages bookings" on public.bookings for all to authenticated using (public.is_daily_red_sea_admin()) with check (public.is_daily_red_sea_admin());
create policy "Authorized admin manages expenses" on public.expenses for all to authenticated using (public.is_daily_red_sea_admin()) with check (public.is_daily_red_sea_admin());
create policy "Authorized admin manages suppliers" on public.suppliers for all to authenticated using (public.is_daily_red_sea_admin()) with check (public.is_daily_red_sea_admin());
create policy "Authorized admin manages sales people" on public.sales_people for all to authenticated using (public.is_daily_red_sea_admin()) with check (public.is_daily_red_sea_admin());

-- Public booking forms can create requests, but only authenticated admins can view or edit them.
create policy "Visitors can create bookings" on public.bookings for insert to anon with check (true);
