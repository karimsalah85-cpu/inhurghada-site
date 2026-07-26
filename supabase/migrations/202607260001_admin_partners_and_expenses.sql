create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  commission_percent numeric(5,2) check (commission_percent is null or (commission_percent >= 0 and commission_percent <= 100)),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.expenses
  add column if not exists expense_type text not null default 'other',
  add column if not exists supplier_id uuid references public.suppliers(id) on delete set null,
  add column if not exists sales_person_id uuid references public.sales_people(id) on delete set null,
  add column if not exists booking_id uuid references public.bookings(id) on delete set null;

alter table public.suppliers enable row level security;
alter table public.sales_people enable row level security;

drop policy if exists "Authorized admin manages suppliers" on public.suppliers;
create policy "Authorized admin manages suppliers" on public.suppliers
  for all to authenticated
  using (public.is_daily_red_sea_admin())
  with check (public.is_daily_red_sea_admin());

drop policy if exists "Authorized admin manages sales people" on public.sales_people;
create policy "Authorized admin manages sales people" on public.sales_people
  for all to authenticated
  using (public.is_daily_red_sea_admin())
  with check (public.is_daily_red_sea_admin());

