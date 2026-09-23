-- Finance: one booking_financials header per booking plus one
-- booking_financial_lines row per trip, so every trip is recognised on its own
-- trip date (accrual basis) and can have its own supplier. Rows are created and
-- kept in sync automatically (see 20260923090300_supplier_ledger.sql).
--
-- RECOGNITION RULES (applied by finance_line_before_write):
--   outcome is derived from the booking: new -> pending, confirmed -> active,
--   completed -> completed, cancelled -> cancelled; the finance-only no_show flag
--   turns active/completed into no_show. Trips dropped from a booking -> removed.
--   * pending / removed / excluded (archived without any recorded transaction):
--     nothing is recognised and no ledger entries exist.
--   * active, completed, no_show: revenue = net selling price - refunded amount;
--     supplier cost, agent commission and payment fees are recognised. A full
--     refund (refunded >= net) reverses supplier cost and agent commission;
--     supplier_cancellation_fee is recognised instead.
--   * cancelled and unpaid: revenue 0; only supplier_cancellation_fee (default 0)
--     and any manually entered payment fees are recognised.
--   * cancelled but paid/refunded: revenue = net - refunded (default refund is
--     the full net when payment_status = refunded, so revenue is 0 unless you
--     record a partial refund); cost = supplier_cancellation_fee.
--   refunded_amount defaults to the full net price when the booking payment
--   status is refunded and to 0 otherwise, until someone enters it manually.
--
-- MONEY: numeric throughout. drs_commission = net sales - supplier cost - agent
-- commission; margin_amount = drs_commission - payment fees; margin_pct is a
-- percentage of recognised net sales. USD figures are converted component by
-- component at the trip-date rate, and USD subtotals are derived from those
-- components so every USD report adds up to the cent.

create type public.finance_collector as enum ('daily_red_sea', 'supplier');
create type public.finance_collection_status as enum ('not_collected', 'partial', 'collected');
create type public.finance_line_outcome as enum ('pending', 'active', 'completed', 'cancelled', 'no_show', 'removed');
create type public.finance_cost_source as enum ('assignment', 'supplier_price', 'supplier_percent', 'manual_amount', 'manual_percent', 'none');

-- Supplier prices can now also be a percentage of the net selling price.
alter table public.supplier_prices
  add column cost_percent numeric(7,4) check (cost_percent is null or (cost_percent >= 0 and cost_percent <= 100));

create table public.booking_financials (
  booking_id uuid primary key references public.bookings(id) on delete cascade,
  reference text not null,
  booking_currency public.finance_currency not null,
  booking_status text not null,
  payment_status text not null,
  archived boolean not null default false,
  agent_commission_percent numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.booking_financial_lines (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.booking_financials(booking_id) on delete cascade,
  line_no integer not null check (line_no >= 1),
  -- trip (derived from the booking)
  trip_date date,
  tour_slug text,
  tour_name text,
  destination text,
  product_line text not null default 'tour',
  guests integer not null default 0 check (guests >= 0),
  adults integer not null default 0 check (adults >= 0),
  youth integer not null default 0 check (youth >= 0),
  payment_status text not null default 'unpaid',
  outcome public.finance_line_outcome not null default 'pending',
  excluded_reason text check (excluded_reason is null or excluded_reason in ('archived')),
  -- selling side, in the booking currency
  currency public.finance_currency not null,
  selling_price numeric(14,2) not null default 0 check (selling_price >= 0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0 and discount_amount <= selling_price),
  net_selling_price numeric(14,2) generated always as (selling_price - discount_amount) stored,
  refunded_amount numeric(14,2) not null default 0 check (refunded_amount >= 0),
  refund_manual boolean not null default false,
  payment_fees numeric(14,2) not null default 0 check (payment_fees >= 0),
  agent_commission numeric(14,2) not null default 0 check (agent_commission >= 0),
  agent_commission_manual boolean not null default false,
  -- supplier side, in the supplier cost currency
  supplier_id uuid references public.suppliers(id) on delete restrict,
  supplier_manual boolean not null default false,
  supplier_cost_source public.finance_cost_source not null default 'none',
  supplier_cost_percent numeric(7,4) check (supplier_cost_percent is null or (supplier_cost_percent >= 0 and supplier_cost_percent <= 100)),
  supplier_cost numeric(14,2) not null default 0 check (supplier_cost >= 0),
  supplier_cost_currency public.finance_currency not null,
  supplier_cancellation_fee numeric(14,2) not null default 0 check (supplier_cancellation_fee >= 0),
  -- collection
  collected_by public.finance_collector not null default 'supplier',
  collection_status public.finance_collection_status not null default 'not_collected',
  collected_amount numeric(14,2) not null default 0 check (collected_amount >= 0),
  no_show boolean not null default false,
  -- FX (rate used is stored so reports never move when rates change)
  fx_rate_to_usd numeric(20,12),
  fx_rate_date date,
  fx_locked boolean not null default false,
  supplier_fx_rate_to_usd numeric(20,12),
  supplier_fx_rate_date date,
  supplier_fx_locked boolean not null default false,
  fx_missing boolean not null default true,
  -- recognised amounts (computed by trigger), booking currency unless noted
  included boolean not null default false,
  recognised_gross numeric(14,2) not null default 0,
  recognised_discount numeric(14,2) not null default 0,
  recognised_refund numeric(14,2) not null default 0,
  recognised_revenue numeric(14,2) not null default 0,
  recognised_supplier_cost numeric(14,2) not null default 0,          -- supplier cost currency
  recognised_supplier_cost_booking_ccy numeric(14,2),
  recognised_agent_commission numeric(14,2) not null default 0,
  recognised_payment_fees numeric(14,2) not null default 0,
  drs_commission numeric(14,2),
  margin_amount numeric(14,2),
  margin_pct numeric(9,2),
  -- the same, in USD
  gross_usd numeric(14,2),
  discount_usd numeric(14,2),
  refund_usd numeric(14,2),
  net_sales_usd numeric(14,2),
  supplier_cost_usd numeric(14,2),
  agent_commission_usd numeric(14,2),
  payment_fees_usd numeric(14,2),
  drs_commission_usd numeric(14,2),
  margin_amount_usd numeric(14,2),
  margin_pct_usd numeric(9,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id, line_no),
  check (collected_amount = 0 or collection_status <> 'not_collected')
);

create index booking_financial_lines_trip_date_idx on public.booking_financial_lines (trip_date) where included;
create index booking_financial_lines_supplier_idx on public.booking_financial_lines (supplier_id, trip_date);
create index booking_financial_lines_tour_idx on public.booking_financial_lines (tour_slug);

create function public.finance_line_before_write() returns trigger
language plpgsql set search_path = '' as $$
declare
  fx record;
  net numeric;
  revenue_basis boolean;
  cost_applies boolean;
begin
  net := new.selling_price - new.discount_amount;

  if new.supplier_cost_source in ('supplier_percent', 'manual_percent') then
    new.supplier_cost := round(net * coalesce(new.supplier_cost_percent, 0) / 100, 2);
    new.supplier_cost_currency := new.currency;
  elsif new.supplier_cost_source = 'none' then
    new.supplier_cost := 0;
    new.supplier_cost_currency := new.currency;
  end if;

  if tg_op = 'INSERT' or not new.fx_locked or new.fx_rate_to_usd is null
     or new.currency is distinct from old.currency or new.trip_date is distinct from old.trip_date then
    select * into fx from public.finance_fx_lookup(new.currency, new.trip_date);
    new.fx_rate_to_usd := fx.usd_per_unit; new.fx_rate_date := fx.rate_date; new.fx_locked := coalesce(fx.locked, false);
  end if;
  if tg_op = 'INSERT' or not new.supplier_fx_locked or new.supplier_fx_rate_to_usd is null
     or new.supplier_cost_currency is distinct from old.supplier_cost_currency or new.trip_date is distinct from old.trip_date then
    select * into fx from public.finance_fx_lookup(new.supplier_cost_currency, new.trip_date);
    new.supplier_fx_rate_to_usd := fx.usd_per_unit; new.supplier_fx_rate_date := fx.rate_date; new.supplier_fx_locked := coalesce(fx.locked, false);
  end if;
  new.fx_missing := new.fx_rate_to_usd is null or new.supplier_fx_rate_to_usd is null;

  if not new.refund_manual then
    new.refunded_amount := case when new.payment_status = 'refunded' then net else 0 end;
  end if;
  if new.refunded_amount > net then
    raise exception 'Refunded amount (%) cannot exceed the net selling price (%).', new.refunded_amount, net using errcode = '23514';
  end if;

  new.included := new.excluded_reason is null and new.outcome not in ('pending', 'removed');
  revenue_basis := new.included and (new.outcome in ('active', 'completed', 'no_show')
    or (new.outcome = 'cancelled' and new.payment_status in ('paid', 'refunded')));
  cost_applies := new.included and new.outcome in ('active', 'completed', 'no_show') and (net = 0 or new.refunded_amount < net);

  new.recognised_gross := case when revenue_basis then new.selling_price else 0 end;
  new.recognised_discount := case when revenue_basis then new.discount_amount else 0 end;
  new.recognised_refund := case when revenue_basis then new.refunded_amount else 0 end;
  new.recognised_revenue := new.recognised_gross - new.recognised_discount - new.recognised_refund;
  new.recognised_supplier_cost := case when cost_applies then new.supplier_cost when new.included then new.supplier_cancellation_fee else 0 end;
  new.recognised_agent_commission := case when cost_applies then new.agent_commission else 0 end;
  new.recognised_payment_fees := case when new.included then new.payment_fees else 0 end;

  new.recognised_supplier_cost_booking_ccy := case
    when new.supplier_cost_currency = new.currency then new.recognised_supplier_cost
    when new.fx_missing then null
    else round(new.recognised_supplier_cost * new.supplier_fx_rate_to_usd / new.fx_rate_to_usd, 2) end;
  new.drs_commission := new.recognised_revenue - new.recognised_supplier_cost_booking_ccy - new.recognised_agent_commission;
  new.margin_amount := new.drs_commission - new.recognised_payment_fees;
  new.margin_pct := case when new.recognised_revenue > 0 and new.margin_amount is not null
    then round(new.margin_amount / new.recognised_revenue * 100, 2) end;

  new.gross_usd := public.finance_to_usd(new.recognised_gross, new.fx_rate_to_usd);
  new.discount_usd := public.finance_to_usd(new.recognised_discount, new.fx_rate_to_usd);
  new.refund_usd := public.finance_to_usd(new.recognised_refund, new.fx_rate_to_usd);
  new.net_sales_usd := new.gross_usd - new.discount_usd - new.refund_usd;
  new.supplier_cost_usd := public.finance_to_usd(new.recognised_supplier_cost, new.supplier_fx_rate_to_usd);
  new.agent_commission_usd := public.finance_to_usd(new.recognised_agent_commission, new.fx_rate_to_usd);
  new.payment_fees_usd := public.finance_to_usd(new.recognised_payment_fees, new.fx_rate_to_usd);
  new.drs_commission_usd := new.net_sales_usd - new.supplier_cost_usd - new.agent_commission_usd;
  new.margin_amount_usd := new.drs_commission_usd - new.payment_fees_usd;
  new.margin_pct_usd := case when new.net_sales_usd > 0 and new.margin_amount_usd is not null
    then round(new.margin_amount_usd / new.net_sales_usd * 100, 2) end;

  new.updated_at := now();
  return new;
end $$;

create trigger booking_financial_lines_before_write before insert or update on public.booking_financial_lines
  for each row execute function public.finance_line_before_write();
create trigger booking_financials_audit after insert or update or delete on public.booking_financials
  for each row execute function public.finance_audit_trigger('booking_id');
create trigger booking_financial_lines_audit after insert or update or delete on public.booking_financial_lines
  for each row execute function public.finance_audit_trigger('id');

alter table public.booking_financials enable row level security;
alter table public.booking_financial_lines enable row level security;
create policy "Finance staff read booking financials" on public.booking_financials for select to authenticated using (public.admin_has_permission('view_finance'));
create policy "Finance staff read booking financial lines" on public.booking_financial_lines for select to authenticated using (public.admin_has_permission('view_finance'));

revoke all on public.booking_financials, public.booking_financial_lines from anon, authenticated;
grant select on public.booking_financials, public.booking_financial_lines to authenticated;
grant all on public.booking_financials, public.booking_financial_lines to service_role;
revoke all on function public.finance_line_before_write() from public, anon, authenticated;
