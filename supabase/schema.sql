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
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;
alter table public.expenses enable row level security;

create policy "Authenticated admins manage bookings" on public.bookings for all to authenticated using (true) with check (true);
create policy "Authenticated admins manage expenses" on public.expenses for all to authenticated using (true) with check (true);
