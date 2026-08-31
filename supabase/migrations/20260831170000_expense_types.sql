-- Admin-editable list of expense categories. Previously a hardcoded enum in
-- application code; admins can now add their own cost types. expenses.expense_type
-- stays free text (no FK) so removing a type never orphans a recorded expense.

create table if not exists public.expense_types (
  key text primary key,
  label text not null,
  sort_order integer not null default 100,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  created_by text
);

insert into public.expense_types (key, label, sort_order, is_system) values
  ('google_ads', 'Google Ads', 10, true),
  ('subscriptions', 'Subscriptions', 20, true),
  ('supplier_per_trip', 'Supplier per trip', 30, true),
  ('sales_commission', 'Sales person commission', 40, true),
  ('fuel', 'Fuel', 50, true),
  ('guide_fees', 'Guide fees', 60, true),
  ('boat_costs', 'Boat costs', 70, true),
  ('other', 'Other', 999, true)
on conflict (key) do nothing;

alter table public.expense_types enable row level security;

drop policy if exists "Authorized admin manages expense types" on public.expense_types;
create policy "Authorized admin manages expense types" on public.expense_types
  for all to authenticated
  using (public.is_daily_red_sea_admin())
  with check (public.is_daily_red_sea_admin());
