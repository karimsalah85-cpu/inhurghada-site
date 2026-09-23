-- Finance module foundation: reporting currency, finance permissions, dated FX
-- rates, the finance audit trigger, and tour dimensions used for reporting.
-- Reporting currency is USD, fixed. Every finance record stores its original
-- amount + currency, the usd-per-unit rate it was converted with, and the rate
-- date, so historical reports never change when rates change.

create type public.finance_currency as enum ('USD', 'EUR', 'GBP', 'EGP', 'SAR');

-- ---------------------------------------------------------------------------
-- Permissions: view_finance / manage_finance for owner, manager and finance.
-- ---------------------------------------------------------------------------
alter table public.admin_role_permissions drop constraint if exists admin_role_permissions_permission_check;
alter table public.admin_role_permissions add constraint admin_role_permissions_permission_check check (permission in (
  'view_bookings','edit_bookings','view_expenses','edit_expenses','view_suppliers','edit_suppliers','view_analytics',
  'view_reports','manage_operations','manage_content','manage_settings','manage_users','view_finance','manage_finance'));

insert into public.admin_role_permissions (role, permission, allowed)
select role, permission, role in ('owner', 'manager', 'finance')
from unnest(array['owner','manager','sales','finance','operations','content_editor']) role
cross join unnest(array['view_finance','manage_finance']) permission
on conflict (role, permission) do nothing;

-- ---------------------------------------------------------------------------
-- FX rates. usd_per_unit = how many USD one unit of the currency is worth.
-- Daily snapshots come from free sources; an admin override (source 'manual')
-- is never overwritten by an automatic fetch.
-- ---------------------------------------------------------------------------
create table public.fx_rates (
  rate_date date not null,
  currency public.finance_currency not null,
  units_per_usd numeric(20,10) not null check (units_per_usd > 0),
  usd_per_unit numeric(20,12) generated always as (round(1 / units_per_usd, 12)) stored,
  source text not null check (source in ('open_er_api', 'currency_api', 'peg', 'manual')),
  note text,
  set_by uuid references auth.users(id) on delete set null,
  fetched_at timestamptz not null default now(),
  primary key (rate_date, currency),
  check (currency <> 'USD' or units_per_usd = 1)
);

-- Rate used for a record dated p_date: the latest rate on or before that date,
-- otherwise the earliest known rate. It is "locked" only when a rate for that
-- exact date exists; until then it is provisional and the daily job backfills
-- the exact date (history is available from the free currency API) and
-- re-converts every provisional record.
create function public.finance_fx_lookup(p_currency public.finance_currency, p_date date,
  out usd_per_unit numeric, out rate_date date, out locked boolean)
language plpgsql stable set search_path = '' as $$
begin
  locked := false;
  if p_currency = 'USD' then
    usd_per_unit := 1; rate_date := p_date; locked := p_date is not null; return;
  end if;
  if p_date is null then return; end if;
  select r.usd_per_unit, r.rate_date into usd_per_unit, rate_date
    from public.fx_rates r where r.currency = p_currency and r.rate_date <= p_date
    order by r.rate_date desc limit 1;
  if usd_per_unit is null then
    select r.usd_per_unit, r.rate_date into usd_per_unit, rate_date
      from public.fx_rates r where r.currency = p_currency
      order by r.rate_date asc limit 1;
  end if;
  locked := usd_per_unit is not null and rate_date = p_date;
end $$;

-- All USD conversion goes through here: numeric math, rounded half away from zero to cents.
create function public.finance_to_usd(p_amount numeric, p_usd_per_unit numeric)
returns numeric language sql immutable set search_path = '' as $$
  select case when p_amount is null or p_usd_per_unit is null then null else round(p_amount * p_usd_per_unit, 2) end;
$$;

-- ---------------------------------------------------------------------------
-- Audit: every finance mutation lands in admin_audit_log. The first trigger
-- argument names the primary-key column used as resource_id.
-- ---------------------------------------------------------------------------
create function public.finance_audit_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  before_row jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  after_row jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
begin
  if tg_op = 'UPDATE' and before_row - 'updated_at' = after_row - 'updated_at' then return null; end if;
  insert into public.admin_audit_log (actor_id, actor_email, action, resource_type, resource_id, summary, before_data, after_data)
  values (
    auth.uid(),
    coalesce(nullif(lower(coalesce(auth.jwt() ->> 'email', '')), ''), 'system'),
    lower(tg_op),
    tg_table_name,
    coalesce(after_row, before_row) ->> tg_argv[0],
    format('Finance %s on %s', lower(tg_op), tg_table_name),
    before_row,
    after_row
  );
  return null;
end $$;

create trigger fx_rates_audit after insert or update or delete on public.fx_rates
  for each row execute function public.finance_audit_trigger('currency');

-- ---------------------------------------------------------------------------
-- Tour dimensions for reporting (destination + product line). Upserted from the
-- application tour catalog by the daily automation run.
-- ---------------------------------------------------------------------------
create table public.finance_tour_dimensions (
  tour_slug text primary key,
  tour_name text not null,
  destination text,
  product_line text not null,
  updated_at timestamptz not null default now()
);

-- Failures inside automatic finance syncing are recorded here (and surfaced in
-- the finance admin) instead of ever blocking a booking from being saved.
create table public.finance_sync_errors (
  id bigint generated always as identity primary key,
  booking_id uuid,
  context text not null,
  message text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index finance_sync_errors_open_idx on public.finance_sync_errors (created_at desc) where resolved_at is null;

alter table public.fx_rates enable row level security;
alter table public.finance_tour_dimensions enable row level security;
alter table public.finance_sync_errors enable row level security;

create policy "Finance staff read fx rates" on public.fx_rates for select to authenticated using (public.admin_has_permission('view_finance'));
create policy "Finance staff read tour dimensions" on public.finance_tour_dimensions for select to authenticated using (public.admin_has_permission('view_finance'));
create policy "Finance staff read sync errors" on public.finance_sync_errors for select to authenticated using (public.admin_has_permission('view_finance'));

revoke all on public.fx_rates, public.finance_tour_dimensions, public.finance_sync_errors from anon, authenticated;
grant select on public.fx_rates, public.finance_tour_dimensions, public.finance_sync_errors to authenticated;
grant all on public.fx_rates, public.finance_tour_dimensions, public.finance_sync_errors to service_role;

revoke all on function public.finance_fx_lookup(public.finance_currency, date) from public, anon;
revoke all on function public.finance_audit_trigger() from public, anon, authenticated;
grant execute on function public.finance_fx_lookup(public.finance_currency, date) to authenticated, service_role;
grant execute on function public.finance_to_usd(numeric, numeric) to authenticated, service_role;
