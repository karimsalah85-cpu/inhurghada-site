-- Finance phase 5: VAT set up for how it works in Egypt (and Saudi Arabia for
-- Jeddah), and a queue of guest payments still to record.
--
-- EGYPT (VAT Law 67/2016 and its executive regulations):
--   * standard rate 14%; tours, boat trips and transfers taken in Egypt are
--     local services (the guest is physically here), so not zero-rated exports;
--   * a registered supplier's VAT is on its tax (e-)invoice, normally added on
--     top of its price; small partners who are not registered charge none, and
--     only VAT on a registered supplier's invoice can be deducted;
--   * VAT is due at the earlier of the invoice and the payment, so a deposit
--     is taxed in the month it is received and the rest in the trip month;
--   * returns are monthly, due by the end of the following month.
-- SAUDI ARABIA: 15%; a rate is set up but NOT a default, because selling
-- Jeddah trips only needs Saudi VAT once Daily Red Sea is registered there.
-- REVENUE is reported excluding output VAT, and partner costs excluding VAT
-- that can be deducted (accounting standards treat VAT as collected for the
-- state, not income).
--
-- Everything stays configurable: countries, which destinations belong to each
-- and how often each files are rows in tax_jurisdictions; rates are rows in
-- tax_rates (now with an optional country); each partner has a VAT status.

-- ---------------------------------------------------------------------------
-- Countries (tax jurisdictions).
-- ---------------------------------------------------------------------------
create table public.tax_jurisdictions (
  country text primary key check (country ~ '^[A-Z]{2}$'),
  name text not null check (length(trim(name)) between 2 and 60),
  is_home boolean not null default false,
  destinations text[] not null default '{}',
  filing_frequency text not null check (filing_frequency in ('monthly', 'quarterly')),
  filing_due_months integer not null default 1 check (filing_due_months between 0 and 6),
  note text check (note is null or length(note) <= 500),
  updated_at timestamptz not null default now()
);
create unique index tax_jurisdictions_one_home on public.tax_jurisdictions (is_home) where is_home;

create trigger tax_jurisdictions_no_delete before delete on public.tax_jurisdictions
  for each row execute function public.finance_block_delete();
create trigger tax_jurisdictions_no_truncate before truncate on public.tax_jurisdictions
  for each statement execute function public.finance_block_delete();
create trigger tax_jurisdictions_audit after insert or update on public.tax_jurisdictions
  for each row execute function public.finance_audit_trigger('country');

insert into public.tax_jurisdictions (country, name, is_home, destinations, filing_frequency, filing_due_months, note) values
  ('EG', 'Egypt', true, array['hurghada', 'marsa-alam', 'el-gouna'], 'monthly', 1,
   'VAT Law 67/2016: monthly return, due by the end of the following month.'),
  ('SA', 'Saudi Arabia', false, array['jeddah'], 'quarterly', 1,
   'ZATCA: quarterly return (monthly above SAR 40M turnover), due by the end of the month after the period.');

-- The country a trip is taxed in: the one listing its destination, else home.
create function public.finance_trip_country(p_destination text)
returns text language sql stable set search_path = '' as $$
  select coalesce(
    (select country from public.tax_jurisdictions where p_destination = any(destinations) order by is_home desc, country limit 1),
    (select country from public.tax_jurisdictions where is_home));
$$;

create function public.finance_home_country()
returns text language sql stable set search_path = '' as $$
  select country from public.tax_jurisdictions where is_home;
$$;

-- ---------------------------------------------------------------------------
-- Rates per country; one default for sales and one for purchases per country.
-- ---------------------------------------------------------------------------
alter table public.tax_rates add column country text references public.tax_jurisdictions(country) on delete restrict;

create or replace function public.tax_rates_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Tax rates are never deleted; set an end date instead.' using errcode = '55000';
  end if;
  if (new.code, new.rate_percent, new.applies_to, new.effective_from, new.country)
     is distinct from (old.code, old.rate_percent, old.applies_to, old.effective_from, old.country) then
    raise exception 'A tax rate''s code, percent, kind, country and start date cannot change; end it and add a new rate.' using errcode = '55000';
  end if;
  new.updated_at := now();
  return new;
end $$;

drop index public.tax_rates_one_default_for_sales;
drop index public.tax_rates_one_default_for_purchases;
create unique index tax_rates_one_default_for_sales on public.tax_rates (coalesce(country, '')) where default_for_sales;
create unique index tax_rates_one_default_for_purchases on public.tax_rates (coalesce(country, '')) where default_for_purchases;

-- Default rate for a kind, date and country: a rate for that country first,
-- then one with no country.
drop function public.finance_default_tax_rate(text, date);
create function public.finance_default_tax_rate(p_kind text, p_date date, p_country text)
returns uuid language sql stable set search_path = '' as $$
  select id from public.tax_rates
  where (case when p_kind = 'sales' then default_for_sales else default_for_purchases end)
    and (country is null or country = p_country)
    and coalesce(p_date, current_date) >= effective_from
    and (effective_to is null or coalesce(p_date, current_date) <= effective_to)
  order by (country is not null) desc
  limit 1;
$$;
revoke all on function public.finance_default_tax_rate(text, date, text) from public, anon, authenticated;

-- VAT in an amount: 'included' = the part of a VAT-inclusive amount,
-- 'on_top' = VAT added to a price that excludes it.
create function public.finance_tax_amount(p_amount numeric, p_percent numeric, p_mode text)
returns numeric language sql immutable set search_path = '' as $$
  select case when p_amount is null or p_percent is null or p_percent = 0 then 0
    when p_mode = 'on_top' then round(p_amount * p_percent / 100, 2)
    else round(p_amount * p_percent / (100 + p_percent), 2) end;
$$;
grant execute on function public.finance_tax_amount(numeric, numeric, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Partners: VAT status. Not registered (the default) = no VAT and nothing to
-- deduct; registered = VAT on their invoice, included in or added to price.
-- ---------------------------------------------------------------------------
alter table public.suppliers add column vat_status text not null default 'not_registered'
  check (vat_status in ('not_registered', 'included', 'on_top'));

alter table public.booking_financial_lines
  add column purchase_tax_mode text check (purchase_tax_mode in ('included', 'on_top')),
  add column extra_partner_included_tax_usd numeric(14,2) default 0,
  add column revenue_ex_vat_usd numeric(14,2),
  add column partner_cost_ex_vat_usd numeric(14,2),
  add column margin_ex_vat_usd numeric(14,2);
alter table public.booking_line_partner_costs
  add column tax_mode text check (tax_mode in ('included', 'on_top'));

-- ---------------------------------------------------------------------------
-- VAT triggers (replacing phase 3's). Sales VAT defaults by the trip's
-- country; purchase VAT only for partners registered for VAT.
-- ---------------------------------------------------------------------------
create or replace function public.finance_line_tax() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  country text := public.finance_trip_country(new.destination);
  partner_status text;
  included_input numeric;
begin
  if new.supplier_id is not null then
    select vat_status into partner_status from public.suppliers where id = new.supplier_id;
  end if;
  if tg_op = 'INSERT' then
    new.sales_tax_rate_id := coalesce(new.sales_tax_rate_id, public.finance_default_tax_rate('sales', new.trip_date, country));
    if new.purchase_tax_rate_id is null and coalesce(partner_status, 'not_registered') <> 'not_registered' then
      new.purchase_tax_rate_id := public.finance_default_tax_rate('purchases', new.trip_date, country);
    end if;
  else
    -- Moved to another country: that country's default applies.
    if country is distinct from public.finance_trip_country(old.destination) and new.sales_tax_rate_id is not distinct from old.sales_tax_rate_id then
      new.sales_tax_rate_id := public.finance_default_tax_rate('sales', new.trip_date, country);
    end if;
    -- Another main partner: their VAT status applies.
    if new.supplier_id is distinct from old.supplier_id and new.purchase_tax_rate_id is not distinct from old.purchase_tax_rate_id then
      new.purchase_tax_rate_id := case when coalesce(partner_status, 'not_registered') = 'not_registered' then null
        else public.finance_default_tax_rate('purchases', new.trip_date, country) end;
    end if;
  end if;

  if tg_op = 'INSERT' or new.sales_tax_rate_id is distinct from old.sales_tax_rate_id then
    new.sales_tax_percent := public.finance_tax_percent(new.sales_tax_rate_id, 'sales', new.trip_date);
  else
    new.sales_tax_percent := old.sales_tax_percent;
  end if;
  if tg_op = 'INSERT' or new.purchase_tax_rate_id is distinct from old.purchase_tax_rate_id or new.supplier_id is distinct from old.supplier_id then
    new.purchase_tax_percent := public.finance_tax_percent(new.purchase_tax_rate_id, 'purchases', new.trip_date);
    new.purchase_tax_mode := case when new.purchase_tax_rate_id is null then null
      when partner_status = 'on_top' then 'on_top' else 'included' end;
  else
    new.purchase_tax_percent := old.purchase_tax_percent;
    new.purchase_tax_mode := old.purchase_tax_mode;
  end if;

  new.sales_tax_amount := public.finance_tax_amount(new.recognised_revenue, new.sales_tax_percent, 'included');
  new.sales_tax_usd := case when new.sales_tax_amount = 0 then 0 else public.finance_to_usd(new.sales_tax_amount, new.fx_rate_to_usd) end;
  new.purchase_tax_amount := public.finance_tax_amount(new.recognised_supplier_cost, new.purchase_tax_percent, new.purchase_tax_mode);
  new.purchase_tax_usd := case when new.purchase_tax_amount = 0 then 0 else public.finance_to_usd(new.purchase_tax_amount, new.supplier_fx_rate_to_usd) end;

  -- Excluding VAT: output VAT out of revenue; deductible VAT that is inside a
  -- partner's price out of costs (VAT added on top was never in the cost).
  included_input := case when new.purchase_tax_mode = 'included' then new.purchase_tax_usd else 0 end
    + new.extra_partner_included_tax_usd;
  new.revenue_ex_vat_usd := new.net_sales_usd - new.sales_tax_usd;
  new.partner_cost_ex_vat_usd := new.total_partner_cost_usd - included_input;
  new.margin_ex_vat_usd := new.margin_amount_usd - new.sales_tax_usd + included_input;
  return new;
end $$;

create or replace function public.finance_partner_cost_tax() returns trigger
language plpgsql security definer set search_path = '' as $$
declare partner_status text; country text;
begin
  if tg_op = 'INSERT' then
    select vat_status into partner_status from public.suppliers where id = new.supplier_id;
    select public.finance_trip_country(l.destination) into country from public.booking_financial_lines l where l.id = new.line_id;
    if new.tax_rate_id is null and coalesce(partner_status, 'not_registered') <> 'not_registered' then
      new.tax_rate_id := public.finance_default_tax_rate('purchases', new.trip_date, country);
    end if;
  end if;
  if tg_op = 'INSERT' or new.tax_rate_id is distinct from old.tax_rate_id then
    if partner_status is null then select vat_status into partner_status from public.suppliers where id = new.supplier_id; end if;
    new.tax_percent := public.finance_tax_percent(new.tax_rate_id, 'purchases', new.trip_date);
    new.tax_mode := case when new.tax_rate_id is null then null when partner_status = 'on_top' then 'on_top' else 'included' end;
  else
    new.tax_percent := old.tax_percent;
    new.tax_mode := old.tax_mode;
  end if;
  new.tax_amount := public.finance_tax_amount(new.recognised_cost, new.tax_percent, new.tax_mode);
  new.tax_usd := case when new.tax_amount = 0 then 0 else public.finance_to_usd(new.tax_amount, new.fx_rate_to_usd) end;
  return new;
end $$;

-- Expenses are taxed where the business is (the home country).
create or replace function public.finance_expense_tax() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.tax_rate_id := coalesce(new.tax_rate_id, public.finance_default_tax_rate('purchases', new.expense_date, public.finance_home_country()));
  end if;
  if tg_op = 'INSERT' or new.tax_rate_id is distinct from old.tax_rate_id then
    new.tax_percent := public.finance_tax_percent(new.tax_rate_id, 'purchases', new.expense_date);
  else
    new.tax_percent := old.tax_percent;
  end if;
  new.tax_amount := case when new.voided_at is not null then 0 else public.finance_tax_amount(new.amount, new.tax_percent, 'included') end;
  new.tax_usd := case when new.tax_amount = 0 then 0 else public.finance_to_usd(new.tax_amount, new.fx_rate_to_usd) end;
  return new;
end $$;

drop function public.finance_tax_amount(numeric, numeric);

-- Extra partners' totals now also carry the deductible VAT inside their prices.
create or replace function public.finance_refresh_line_partner_totals(p_line_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_ccy numeric; v_usd numeric; v_tax numeric; any_rows boolean;
begin
  select exists (select 1 from public.booking_line_partner_costs where line_id = p_line_id) into any_rows;
  select case when bool_or(recognised_cost_booking_ccy is null) then null else coalesce(sum(recognised_cost_booking_ccy), 0) end,
         case when bool_or(recognised_cost_usd is null) then null else coalesce(sum(recognised_cost_usd), 0) end,
         case when bool_or(tax_usd is null and tax_mode = 'included') then null
           else coalesce(sum(tax_usd) filter (where tax_mode = 'included'), 0) end
  into v_ccy, v_usd, v_tax
  from public.booking_line_partner_costs where line_id = p_line_id;
  if not any_rows then v_ccy := 0; v_usd := 0; v_tax := 0; end if;
  update public.booking_financial_lines
  set extra_partner_cost_booking_ccy = v_ccy, extra_partner_cost_usd = v_usd, extra_partner_included_tax_usd = v_tax
  where id = p_line_id
    and (extra_partner_cost_booking_ccy, extra_partner_cost_usd, extra_partner_included_tax_usd) is distinct from (v_ccy, v_usd, v_tax);
end $$;

-- ---------------------------------------------------------------------------
-- What partners are owed includes VAT they add on top of their price.
-- ---------------------------------------------------------------------------
create or replace function public.finance_sync_line_ledger(p_line_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  l public.booking_financial_lines;
  want_type public.finance_ledger_entry_type;
  want_amount numeric := 0;
  want_currency public.finance_currency;
  want_rate numeric;
  want_rate_date date;
  want_usd numeric;
  vat_on_top numeric;
  vat_on_top_usd numeric;
  vat_on_top_booking_ccy numeric;
  current_entry record;
  matched boolean := false;
begin
  select * into l from public.booking_financial_lines where id = p_line_id;
  if not found then return; end if;
  vat_on_top := case when l.purchase_tax_mode = 'on_top' then l.purchase_tax_amount else 0 end;
  vat_on_top_usd := case when vat_on_top = 0 then 0 else l.purchase_tax_usd end;

  if l.included and l.supplier_id is not null then
    if l.collected_by = 'daily_red_sea' then
      want_type := 'supplier_cost_payable';
      want_amount := -(l.recognised_supplier_cost + vat_on_top);
      want_currency := l.supplier_cost_currency;
      if l.supplier_fx_locked and l.supplier_cost_usd is not null and vat_on_top_usd is not null then
        want_rate := l.supplier_fx_rate_to_usd;
        want_rate_date := l.supplier_fx_rate_date;
        want_usd := -(l.supplier_cost_usd + vat_on_top_usd);
      end if;
    elsif l.recognised_supplier_cost_booking_ccy is not null
          and (l.supplier_cost_currency = l.currency or (l.fx_locked and l.supplier_fx_locked)) then
      vat_on_top_booking_ccy := case when vat_on_top = 0 then 0
        when l.supplier_cost_currency = l.currency then vat_on_top
        else round(vat_on_top * l.supplier_fx_rate_to_usd / l.fx_rate_to_usd, 2) end;
      want_type := 'commission_receivable';
      want_amount := l.recognised_revenue - l.recognised_supplier_cost_booking_ccy - vat_on_top_booking_ccy;
      want_currency := l.currency;
      if l.fx_locked and l.supplier_fx_locked and l.net_sales_usd is not null and l.supplier_cost_usd is not null and vat_on_top_usd is not null then
        want_rate := l.fx_rate_to_usd;
        want_rate_date := l.fx_rate_date;
        want_usd := l.net_sales_usd - l.supplier_cost_usd - vat_on_top_usd;
      end if;
    end if;
    -- otherwise: cross-currency receivable awaiting locked rates -> no entry
  end if;

  for current_entry in
    select e.* from public.supplier_ledger e
    where e.line_id = l.id and e.partner_cost_id is null and e.is_automatic
      and e.entry_type in ('supplier_cost_payable', 'commission_receivable')
      and not exists (select 1 from public.supplier_ledger r where r.reverses_entry_id = e.id)
    order by e.entry_no
  loop
    if not matched and want_amount <> 0 and current_entry.entry_type = want_type and current_entry.amount = want_amount
       and current_entry.currency = want_currency and current_entry.supplier_id = l.supplier_id
       and current_entry.amount_usd is not distinct from want_usd
       and current_entry.fx_rate_to_usd is not distinct from want_rate
       and current_entry.fx_rate_date is not distinct from want_rate_date then
      matched := true;
    else
      insert into public.supplier_ledger (supplier_id, entry_type, amount, currency, entry_date, reverses_entry_id, is_automatic, note)
      values (current_entry.supplier_id, 'reversal', -current_entry.amount, current_entry.currency, current_date, current_entry.id, true,
        case when current_entry.amount = want_amount and current_entry.entry_type = want_type and current_entry.currency = want_currency
              and current_entry.supplier_id = l.supplier_id
          then 'Automatic reversal: trip-date FX rate updated'
          else 'Automatic reversal: booking financials changed' end);
    end if;
  end loop;

  if not matched and want_amount <> 0 then
    insert into public.supplier_ledger (supplier_id, booking_id, line_id, entry_type, amount, currency, fx_rate_to_usd, fx_rate_date,
      amount_usd, entry_date, is_automatic, note)
    values (l.supplier_id, l.booking_id, l.id, want_type, want_amount, want_currency, want_rate, want_rate_date, want_usd,
      coalesce(l.trip_date, current_date), true,
      format('Automatic: %s, trip %s%s%s', case when want_type = 'supplier_cost_payable' then 'Daily Red Sea collected' else 'supplier collected' end,
        l.line_no, case when vat_on_top <> 0 then ', incl. VAT added by partner' else '' end,
        case when want_usd is null then ' (USD pending final trip-date rate)' else '' end));
  end if;
end $$;

create or replace function public.finance_sync_partner_cost_ledger(p_partner_cost_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  c public.booking_line_partner_costs;
  want_amount numeric := 0;
  want_rate numeric;
  want_rate_date date;
  want_usd numeric;
  vat_on_top numeric;
  vat_on_top_usd numeric;
  current_entry record;
  matched boolean := false;
begin
  select * into c from public.booking_line_partner_costs where id = p_partner_cost_id;
  if not found then return; end if;
  vat_on_top := case when c.tax_mode = 'on_top' then c.tax_amount else 0 end;
  vat_on_top_usd := case when vat_on_top = 0 then 0 else c.tax_usd end;
  want_amount := -(c.recognised_cost + vat_on_top);
  if c.fx_locked and c.recognised_cost_usd is not null and vat_on_top_usd is not null then
    want_rate := c.fx_rate_to_usd; want_rate_date := c.fx_rate_date; want_usd := -(c.recognised_cost_usd + vat_on_top_usd);
  end if;

  for current_entry in
    select e.* from public.supplier_ledger e
    where e.partner_cost_id = c.id and e.is_automatic and e.entry_type = 'supplier_cost_payable'
      and not exists (select 1 from public.supplier_ledger r where r.reverses_entry_id = e.id)
    order by e.entry_no
  loop
    if not matched and want_amount <> 0 and current_entry.amount = want_amount and current_entry.currency = c.currency
       and current_entry.supplier_id = c.supplier_id
       and current_entry.amount_usd is not distinct from want_usd
       and current_entry.fx_rate_to_usd is not distinct from want_rate
       and current_entry.fx_rate_date is not distinct from want_rate_date then
      matched := true;
    else
      insert into public.supplier_ledger (supplier_id, entry_type, amount, currency, entry_date, reverses_entry_id, is_automatic, note)
      values (current_entry.supplier_id, 'reversal', -current_entry.amount, current_entry.currency, current_date, current_entry.id, true,
        case when current_entry.amount = want_amount and current_entry.currency = c.currency and current_entry.supplier_id = c.supplier_id
          then 'Automatic reversal: trip-date FX rate updated'
          when c.status = 'removed' then 'Automatic reversal: partner removed from the trip'
          else 'Automatic reversal: partner cost changed' end);
    end if;
  end loop;

  if not matched and want_amount <> 0 then
    insert into public.supplier_ledger (supplier_id, booking_id, line_id, partner_cost_id, entry_type, amount, currency, fx_rate_to_usd,
      fx_rate_date, amount_usd, entry_date, is_automatic, note)
    select c.supplier_id, c.booking_id, c.line_id, c.id, 'supplier_cost_payable', want_amount, c.currency, want_rate, want_rate_date, want_usd,
      coalesce(c.trip_date, current_date), true,
      format('Automatic: %s on trip %s%s%s', c.role, l.line_no, case when vat_on_top <> 0 then ', incl. VAT added by partner' else '' end,
        case when want_usd is null then ' (USD pending final trip-date rate)' else '' end)
    from public.booking_financial_lines l where l.id = c.line_id;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- VAT per country and month, by tax point: guest payments received before a
-- trip carry its VAT in the month they were received (their share of the
-- booking), the rest falls in the trip month. Purchases by trip date,
-- expenses by expense date. Each row says when that period's return is due.
-- ---------------------------------------------------------------------------
drop view public.finance_vat_summary;
create view public.finance_vat_summary with (security_invoker = true) as
with taxed_lines as (
  select l.id, l.booking_id, l.trip_date, public.finance_trip_country(l.destination) as country, l.sales_tax_usd as vat_usd,
    sum(l.recognised_revenue) over (partition by l.booking_id) as booking_revenue
  from public.booking_financial_lines l
  where l.included and l.trip_date is not null and l.sales_tax_amount <> 0
),
advance as (
  select t.id as line_id, t.country, g.paid_on,
    round(t.vat_usd * g.applied_amount / t.booking_revenue, 2) as vat_usd
  from taxed_lines t join public.guest_payments g on g.booking_id = t.booking_id and g.paid_on < t.trip_date
  where t.booking_revenue > 0
),
items as (
  select a.country, date_trunc('month', a.paid_on)::date as month, 'output' as side, a.vat_usd from advance a
  union all
  select t.country, date_trunc('month', t.trip_date)::date, 'output',
    t.vat_usd - coalesce((select sum(a.vat_usd) from advance a where a.line_id = t.id), 0)
  from taxed_lines t
  union all
  select public.finance_trip_country(l.destination), date_trunc('month', l.trip_date)::date, 'input', l.purchase_tax_usd
  from public.booking_financial_lines l where l.included and l.trip_date is not null and l.purchase_tax_amount <> 0
  union all
  select public.finance_trip_country(l.destination), date_trunc('month', c.trip_date)::date, 'input', c.tax_usd
  from public.booking_line_partner_costs c join public.booking_financial_lines l on l.id = c.line_id
  where c.trip_date is not null and c.tax_amount <> 0
  union all
  select public.finance_home_country(), date_trunc('month', e.expense_date)::date, 'input', e.tax_usd
  from public.expenses e where e.voided_at is null and e.tax_amount <> 0
),
months as (
  select country, month,
    coalesce(sum(vat_usd) filter (where side = 'output'), 0) as output_vat_usd,
    coalesce(sum(vat_usd) filter (where side = 'input'), 0) as input_vat_usd,
    count(*) filter (where side = 'output' and vat_usd <> 0) as output_items,
    count(*) filter (where side = 'input') as input_items,
    count(*) filter (where vat_usd is null) as usd_pending
  from items where vat_usd is null or vat_usd <> 0 or side = 'input'
  group by country, month
)
select m.country, j.name as country_name, m.month,
  m.output_vat_usd, m.input_vat_usd, m.output_vat_usd - m.input_vat_usd as net_vat_usd,
  m.output_items, m.input_items, m.usd_pending,
  j.filing_frequency,
  p.period_start,
  (p.period_start + (case when j.filing_frequency = 'quarterly' then 3 else 1 end + j.filing_due_months) * interval '1 month' - interval '1 day')::date as filing_due_on
from months m
join public.tax_jurisdictions j on j.country = m.country
cross join lateral (select date_trunc(case when j.filing_frequency = 'quarterly' then 'quarter' else 'month' end, m.month)::date as period_start) p;

-- ---------------------------------------------------------------------------
-- Rate RPCs gain a country; defaults are one per country.
-- ---------------------------------------------------------------------------
drop function public.finance_create_tax_rate(text, text, numeric, text, date, date, boolean, boolean, text);
create function public.finance_create_tax_rate(
  p_code text, p_name text, p_rate_percent numeric, p_applies_to text, p_effective_from date,
  p_effective_to date default null, p_default_for_sales boolean default false, p_default_for_purchases boolean default false,
  p_note text default null, p_country text default null)
returns public.tax_rates
language plpgsql security definer set search_path = '' as $$
declare saved public.tax_rates; v_country text := nullif(upper(trim(coalesce(p_country, ''))), '');
begin
  perform public.finance_require('manage_finance');
  if p_default_for_sales then update public.tax_rates set default_for_sales = false where default_for_sales and country is not distinct from v_country; end if;
  if p_default_for_purchases then update public.tax_rates set default_for_purchases = false where default_for_purchases and country is not distinct from v_country; end if;
  insert into public.tax_rates (code, name, rate_percent, applies_to, effective_from, effective_to, default_for_sales, default_for_purchases,
    note, country, created_by, created_by_email)
  values (upper(trim(p_code)), trim(p_name), p_rate_percent, p_applies_to, p_effective_from, p_effective_to,
    coalesce(p_default_for_sales, false), coalesce(p_default_for_purchases, false), nullif(trim(coalesce(p_note, '')), ''), v_country,
    auth.uid(), coalesce(nullif(lower(coalesce(auth.jwt() ->> 'email', '')), ''), 'system'))
  returning * into saved;
  return saved;
end $$;

create or replace function public.finance_update_tax_rate(p_id uuid, p_changes jsonb)
returns public.tax_rates
language plpgsql security definer set search_path = '' as $$
declare r public.tax_rates; unknown text;
begin
  perform public.finance_require('manage_finance');
  if jsonb_typeof(p_changes) <> 'object' then raise exception 'Changes must be an object.' using errcode = '22023'; end if;
  select key into unknown from jsonb_object_keys(p_changes) key
    where key not in ('name', 'effective_to', 'default_for_sales', 'default_for_purchases', 'note') limit 1;
  if unknown is not null then raise exception 'Unknown field %.', unknown using errcode = '22023'; end if;
  select * into r from public.tax_rates where id = p_id for update;
  if not found then raise exception 'Tax rate not found.' using errcode = 'P0002'; end if;
  if p_changes ? 'name' then r.name := trim(p_changes ->> 'name'); end if;
  if p_changes ? 'effective_to' then r.effective_to := nullif(p_changes ->> 'effective_to', '')::date; end if;
  if p_changes ? 'note' then r.note := nullif(trim(coalesce(p_changes ->> 'note', '')), ''); end if;
  if p_changes ? 'default_for_sales' then r.default_for_sales := (p_changes ->> 'default_for_sales')::boolean; end if;
  if p_changes ? 'default_for_purchases' then r.default_for_purchases := (p_changes ->> 'default_for_purchases')::boolean; end if;
  if r.default_for_sales then
    update public.tax_rates set default_for_sales = false where default_for_sales and id <> r.id and country is not distinct from r.country;
  end if;
  if r.default_for_purchases then
    update public.tax_rates set default_for_purchases = false where default_for_purchases and id <> r.id and country is not distinct from r.country;
  end if;
  update public.tax_rates set name = r.name, effective_to = r.effective_to, note = r.note,
    default_for_sales = r.default_for_sales, default_for_purchases = r.default_for_purchases
  where id = r.id returning * into r;
  return r;
end $$;

-- A partner's VAT status. New trips follow it; with p_apply_from, trips from
-- that date whose VAT was set automatically are updated too.
create function public.finance_set_partner_vat_status(p_supplier_id uuid, p_status text, p_apply_from date default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare updated_lines integer := 0; updated_costs integer := 0; line record; cost record; rate uuid;
begin
  perform public.finance_require('manage_finance');
  if p_status not in ('not_registered', 'included', 'on_top') then
    raise exception 'Unknown VAT status %.', p_status using errcode = '22023';
  end if;
  update public.suppliers set vat_status = p_status where id = p_supplier_id;
  if not found then raise exception 'Partner not found.' using errcode = 'P0002'; end if;
  if p_apply_from is not null then
    for line in select id, trip_date, destination from public.booking_financial_lines
      where supplier_id = p_supplier_id and trip_date >= p_apply_from loop
      rate := case when p_status = 'not_registered' then null
        else public.finance_default_tax_rate('purchases', line.trip_date, public.finance_trip_country(line.destination)) end;
      -- Clearing then setting the rate re-reads the partner's status.
      update public.booking_financial_lines set purchase_tax_rate_id = null where id = line.id and purchase_tax_rate_id is not null;
      update public.booking_financial_lines set purchase_tax_rate_id = rate where id = line.id and rate is not null;
      updated_lines := updated_lines + 1;
    end loop;
    for cost in select c.id, c.trip_date, l.destination from public.booking_line_partner_costs c
      join public.booking_financial_lines l on l.id = c.line_id
      where c.supplier_id = p_supplier_id and c.status = 'active' and c.trip_date >= p_apply_from loop
      rate := case when p_status = 'not_registered' then null
        else public.finance_default_tax_rate('purchases', cost.trip_date, public.finance_trip_country(cost.destination)) end;
      update public.booking_line_partner_costs set tax_rate_id = null where id = cost.id and tax_rate_id is not null;
      update public.booking_line_partner_costs set tax_rate_id = rate where id = cost.id and rate is not null;
      updated_costs := updated_costs + 1;
    end loop;
  end if;
  return jsonb_build_object('supplier_id', p_supplier_id, 'vat_status', p_status, 'trips_updated', updated_lines, 'extra_partner_rows_updated', updated_costs);
end $$;

-- ---------------------------------------------------------------------------
-- Guest payments still to record: Daily Red Sea collects the trip and the
-- booking is marked paid/refunded, or the trip has happened, but no payment
-- has been recorded. (Trips the partner collects are paid to the partner.)
-- ---------------------------------------------------------------------------
create view public.finance_payments_to_record with (security_invoker = true) as
select b.id as booking_id, b.reference, b.customer_name, b.tour_name, b.date as trip_date, b.amount, b.currency,
  b.status::text as status, b.payment_status::text as payment_status,
  case when b.payment_status = 'paid' then 'marked_paid'
       when b.payment_status = 'refunded' then 'marked_refunded'
       else 'trip_done_unpaid' end as reason
from public.bookings b
where b.amount > 0
  and not exists (select 1 from public.guest_payments g where g.booking_id = b.id)
  and exists (select 1 from public.booking_financial_lines l where l.booking_id = b.id and l.collected_by = 'daily_red_sea')
  and (b.payment_status in ('paid', 'refunded')
       or (b.status in ('confirmed', 'completed') and b.date < current_date));

-- ---------------------------------------------------------------------------
-- Access.
-- ---------------------------------------------------------------------------
alter table public.tax_jurisdictions enable row level security;
create policy "Finance staff read tax countries" on public.tax_jurisdictions for select to authenticated using (public.admin_has_permission('view_finance'));
revoke all on public.tax_jurisdictions from anon, authenticated;
grant select on public.tax_jurisdictions to authenticated;
grant all on public.tax_jurisdictions to service_role;
revoke all on public.finance_vat_summary, public.finance_payments_to_record from anon, authenticated;
grant select on public.finance_vat_summary, public.finance_payments_to_record to authenticated, service_role;
revoke all on function public.finance_trip_country(text) from public, anon, authenticated;
revoke all on function public.finance_home_country() from public, anon, authenticated;
do $$
declare fn text;
begin
  foreach fn in array array[
    'public.finance_create_tax_rate(text, text, numeric, text, date, date, boolean, boolean, text, text)',
    'public.finance_set_partner_vat_status(uuid, text, date)'
  ] loop
    execute format('revoke all on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Egypt's rate from the start of the next VAT period (1 October 2026), the
-- default for Egyptian trips, partners and expenses; Saudi Arabia's rate is
-- set up for Jeddah but applied only when chosen. September and earlier are
-- left as they were reported. End or replace these on Finance -> VAT.
-- ---------------------------------------------------------------------------
insert into public.tax_rates (code, name, rate_percent, applies_to, effective_from, default_for_sales, default_for_purchases, country, note) values
  ('EG-VAT-14', 'Egypt VAT 14%', 14, 'both', '2026-10-01', true, true, 'EG',
   'Standard rate, VAT Law 67/2016. Tours and transfers in Egypt are local services (not zero-rated exports).'),
  ('SA-VAT-15', 'Saudi VAT 15%', 15, 'both', '2026-10-01', false, false, 'SA',
   'Standard KSA rate. Make it the default for Jeddah once registered with ZATCA.');

-- Trips from 1 October already on file get the rate new trips would get.
update public.booking_financial_lines l set sales_tax_rate_id = r.id
from public.tax_rates r
where r.code = 'EG-VAT-14' and l.sales_tax_rate_id is null and l.trip_date >= r.effective_from
  and public.finance_trip_country(l.destination) = 'EG';
update public.expenses e set tax_rate_id = r.id
from public.tax_rates r
where r.code = 'EG-VAT-14' and e.tax_rate_id is null and e.voided_at is null and e.expense_date >= r.effective_from;

-- Fill the excluding-VAT columns on every trip.
update public.booking_financial_lines set updated_at = now() where revenue_ex_vat_usd is null;
