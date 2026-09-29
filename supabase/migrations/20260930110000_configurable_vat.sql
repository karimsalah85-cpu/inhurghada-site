-- Finance phase 3: configurable VAT. Nothing about tax is hard-coded: rates
-- are rows in tax_rates, set up by the owner or accountant. With no rates set
-- up, every VAT amount is zero and nothing else changes.
--
-- WHAT IS TAXED (each keeps its own rate, a copy of the percent at the time,
-- the VAT amount in its own currency, and that VAT in USD):
--   * sales VAT:     each trip's recognised revenue      (booking_financial_lines.sales_tax_*)
--   * purchase VAT:  the main partner's recognised cost  (booking_financial_lines.purchase_tax_*)
--                    each extra partner's recognised cost (booking_line_partner_costs.tax_*)
--                    each expense                        (expenses.tax_*)
-- AMOUNTS ARE VAT-INCLUSIVE: the recorded amount is what actually changes
-- hands, and the VAT is the part of it at the rate: amount * r / (100 + r).
-- Revenue, costs, margins and what partners are owed are NOT changed by VAT;
-- VAT is reported separately until the accountant confirms the rules.
--
-- RATES are never edited or deleted once created: the percent, code, kind and
-- start date are fixed; a rate is ended with effective_to and replaced by a
-- new one. Each transaction keeps the percent it was given, so reports never
-- move. A default rate (one for sales, one for purchases) is applied to new
-- transactions only.

create table public.tax_rates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_-]{2,20}$'),
  name text not null check (length(trim(name)) between 2 and 80),
  rate_percent numeric(7,4) not null check (rate_percent >= 0 and rate_percent <= 100),
  applies_to text not null check (applies_to in ('sales', 'purchases', 'both')),
  effective_from date not null,
  effective_to date,
  default_for_sales boolean not null default false,
  default_for_purchases boolean not null default false,
  note text check (note is null or length(note) <= 500),
  created_by uuid,
  created_by_email text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from),
  check (not default_for_sales or applies_to in ('sales', 'both')),
  check (not default_for_purchases or applies_to in ('purchases', 'both'))
);
create unique index tax_rates_one_default_for_sales on public.tax_rates (default_for_sales) where default_for_sales;
create unique index tax_rates_one_default_for_purchases on public.tax_rates (default_for_purchases) where default_for_purchases;

create function public.tax_rates_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Tax rates are never deleted; set an end date instead.' using errcode = '55000';
  end if;
  if (new.code, new.rate_percent, new.applies_to, new.effective_from) is distinct from (old.code, old.rate_percent, old.applies_to, old.effective_from) then
    raise exception 'A tax rate''s code, percent, kind and start date cannot change; end it and add a new rate.' using errcode = '55000';
  end if;
  new.updated_at := now();
  return new;
end $$;
revoke all on function public.tax_rates_guard() from public, anon, authenticated;
create trigger tax_rates_guard before update or delete on public.tax_rates
  for each row execute function public.tax_rates_guard();
create trigger tax_rates_no_truncate before truncate on public.tax_rates
  for each statement execute function public.finance_block_delete();
create trigger tax_rates_audit after insert or update on public.tax_rates
  for each row execute function public.finance_audit_trigger('id');

-- ---------------------------------------------------------------------------
-- Helpers.
-- ---------------------------------------------------------------------------
-- VAT contained in a VAT-inclusive amount, rounded half away from zero to cents.
create function public.finance_tax_amount(p_amount numeric, p_percent numeric)
returns numeric language sql immutable set search_path = '' as $$
  select case when p_amount is null or p_percent is null or p_percent = 0 then 0
    else round(p_amount * p_percent / (100 + p_percent), 2) end;
$$;

-- The percent of a rate, checked for the kind of transaction and its date.
create function public.finance_tax_percent(p_rate_id uuid, p_kind text, p_date date)
returns numeric language plpgsql stable set search_path = '' as $$
declare r public.tax_rates;
begin
  if p_rate_id is null then return null; end if;
  select * into r from public.tax_rates where id = p_rate_id;
  if not found then raise exception 'Tax rate not found.' using errcode = 'P0002'; end if;
  if r.applies_to <> 'both' and r.applies_to <> p_kind then
    raise exception 'Tax rate % is for %, not %.', r.code, r.applies_to, p_kind using errcode = '22023';
  end if;
  if coalesce(p_date, current_date) < r.effective_from or (r.effective_to is not null and coalesce(p_date, current_date) > r.effective_to) then
    raise exception 'Tax rate % does not apply on %.', r.code, coalesce(p_date, current_date) using errcode = '22023';
  end if;
  return r.rate_percent;
end $$;

-- The default rate for new transactions of a kind on a date (or none).
create function public.finance_default_tax_rate(p_kind text, p_date date)
returns uuid language sql stable set search_path = '' as $$
  select id from public.tax_rates
  where (case when p_kind = 'sales' then default_for_sales else default_for_purchases end)
    and coalesce(p_date, current_date) >= effective_from
    and (effective_to is null or coalesce(p_date, current_date) <= effective_to)
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- VAT columns.
-- ---------------------------------------------------------------------------
alter table public.booking_financial_lines
  add column sales_tax_rate_id uuid references public.tax_rates(id) on delete restrict,
  add column sales_tax_percent numeric(7,4),
  add column sales_tax_amount numeric(14,2) not null default 0,
  add column sales_tax_usd numeric(14,2) default 0,
  add column purchase_tax_rate_id uuid references public.tax_rates(id) on delete restrict,
  add column purchase_tax_percent numeric(7,4),
  add column purchase_tax_amount numeric(14,2) not null default 0,
  add column purchase_tax_usd numeric(14,2) default 0;

alter table public.booking_line_partner_costs
  add column tax_rate_id uuid references public.tax_rates(id) on delete restrict,
  add column tax_percent numeric(7,4),
  add column tax_amount numeric(14,2) not null default 0,
  add column tax_usd numeric(14,2) default 0;

alter table public.expenses
  add column tax_rate_id uuid references public.tax_rates(id) on delete restrict,
  add column tax_percent numeric(7,4),
  add column tax_amount numeric(14,2) not null default 0,
  add column tax_usd numeric(14,2) default 0;

-- ---------------------------------------------------------------------------
-- VAT triggers. Named so they run AFTER each table's existing before-write
-- trigger (same-timing triggers fire in name order), i.e. on the final
-- recognised amounts and rates. The percent is only (re)read when the rate
-- itself changes; otherwise the stored copy is kept.
-- ---------------------------------------------------------------------------
create function public.finance_line_tax() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.sales_tax_rate_id := coalesce(new.sales_tax_rate_id, public.finance_default_tax_rate('sales', new.trip_date));
    new.purchase_tax_rate_id := coalesce(new.purchase_tax_rate_id, public.finance_default_tax_rate('purchases', new.trip_date));
  end if;
  if tg_op = 'INSERT' or new.sales_tax_rate_id is distinct from old.sales_tax_rate_id then
    new.sales_tax_percent := public.finance_tax_percent(new.sales_tax_rate_id, 'sales', new.trip_date);
  else
    new.sales_tax_percent := old.sales_tax_percent;
  end if;
  if tg_op = 'INSERT' or new.purchase_tax_rate_id is distinct from old.purchase_tax_rate_id then
    new.purchase_tax_percent := public.finance_tax_percent(new.purchase_tax_rate_id, 'purchases', new.trip_date);
  else
    new.purchase_tax_percent := old.purchase_tax_percent;
  end if;
  new.sales_tax_amount := public.finance_tax_amount(new.recognised_revenue, new.sales_tax_percent);
  new.sales_tax_usd := case when new.sales_tax_amount = 0 then 0 else public.finance_to_usd(new.sales_tax_amount, new.fx_rate_to_usd) end;
  new.purchase_tax_amount := public.finance_tax_amount(new.recognised_supplier_cost, new.purchase_tax_percent);
  new.purchase_tax_usd := case when new.purchase_tax_amount = 0 then 0 else public.finance_to_usd(new.purchase_tax_amount, new.supplier_fx_rate_to_usd) end;
  return new;
end $$;

create function public.finance_partner_cost_tax() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.tax_rate_id := coalesce(new.tax_rate_id, public.finance_default_tax_rate('purchases', new.trip_date));
  end if;
  if tg_op = 'INSERT' or new.tax_rate_id is distinct from old.tax_rate_id then
    new.tax_percent := public.finance_tax_percent(new.tax_rate_id, 'purchases', new.trip_date);
  else
    new.tax_percent := old.tax_percent;
  end if;
  new.tax_amount := public.finance_tax_amount(new.recognised_cost, new.tax_percent);
  new.tax_usd := case when new.tax_amount = 0 then 0 else public.finance_to_usd(new.tax_amount, new.fx_rate_to_usd) end;
  return new;
end $$;

create function public.finance_expense_tax() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.tax_rate_id := coalesce(new.tax_rate_id, public.finance_default_tax_rate('purchases', new.expense_date));
  end if;
  if tg_op = 'INSERT' or new.tax_rate_id is distinct from old.tax_rate_id then
    new.tax_percent := public.finance_tax_percent(new.tax_rate_id, 'purchases', new.expense_date);
  else
    new.tax_percent := old.tax_percent;
  end if;
  new.tax_amount := case when new.voided_at is not null then 0 else public.finance_tax_amount(new.amount, new.tax_percent) end;
  new.tax_usd := case when new.tax_amount = 0 then 0 else public.finance_to_usd(new.tax_amount, new.fx_rate_to_usd) end;
  return new;
end $$;

do $$
declare fn text;
begin
  foreach fn in array array['public.finance_line_tax()', 'public.finance_partner_cost_tax()', 'public.finance_expense_tax()'] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;
end $$;

create trigger booking_financial_lines_tax before insert or update on public.booking_financial_lines
  for each row execute function public.finance_line_tax();
create trigger booking_line_partner_costs_tax before insert or update on public.booking_line_partner_costs
  for each row execute function public.finance_partner_cost_tax();
create trigger expenses_tax before insert or update on public.expenses
  for each row execute function public.finance_expense_tax();

-- ---------------------------------------------------------------------------
-- VAT per month (USD). Sales and partner costs by trip date, like the P&L;
-- expenses by expense date. usd_pending counts VAT whose USD rate is missing.
-- ---------------------------------------------------------------------------
create view public.finance_vat_summary with (security_invoker = true) as
with items as (
  select date_trunc('month', l.trip_date)::date as month, 'output' as side, l.sales_tax_amount as vat, l.sales_tax_usd as vat_usd
  from public.booking_financial_lines l where l.included and l.trip_date is not null and l.sales_tax_amount <> 0
  union all
  select date_trunc('month', l.trip_date)::date, 'input', l.purchase_tax_amount, l.purchase_tax_usd
  from public.booking_financial_lines l where l.included and l.trip_date is not null and l.purchase_tax_amount <> 0
  union all
  select date_trunc('month', c.trip_date)::date, 'input', c.tax_amount, c.tax_usd
  from public.booking_line_partner_costs c where c.trip_date is not null and c.tax_amount <> 0
  union all
  select date_trunc('month', e.expense_date)::date, 'input', e.tax_amount, e.tax_usd
  from public.expenses e where e.voided_at is null and e.tax_amount <> 0
)
select month,
  coalesce(sum(vat_usd) filter (where side = 'output'), 0) as output_vat_usd,
  coalesce(sum(vat_usd) filter (where side = 'input'), 0) as input_vat_usd,
  coalesce(sum(vat_usd) filter (where side = 'output'), 0) - coalesce(sum(vat_usd) filter (where side = 'input'), 0) as net_vat_usd,
  count(*) filter (where side = 'output') as output_items,
  count(*) filter (where side = 'input') as input_items,
  count(*) filter (where vat_usd is null) as usd_pending
from items
group by month;

-- ---------------------------------------------------------------------------
-- Write RPCs (owner + accountant).
-- ---------------------------------------------------------------------------
create function public.finance_create_tax_rate(
  p_code text, p_name text, p_rate_percent numeric, p_applies_to text, p_effective_from date,
  p_effective_to date default null, p_default_for_sales boolean default false, p_default_for_purchases boolean default false,
  p_note text default null)
returns public.tax_rates
language plpgsql security definer set search_path = '' as $$
declare saved public.tax_rates;
begin
  perform public.finance_require('manage_finance');
  if p_default_for_sales then update public.tax_rates set default_for_sales = false where default_for_sales; end if;
  if p_default_for_purchases then update public.tax_rates set default_for_purchases = false where default_for_purchases; end if;
  insert into public.tax_rates (code, name, rate_percent, applies_to, effective_from, effective_to, default_for_sales, default_for_purchases,
    note, created_by, created_by_email)
  values (upper(trim(p_code)), trim(p_name), p_rate_percent, p_applies_to, p_effective_from, p_effective_to,
    coalesce(p_default_for_sales, false), coalesce(p_default_for_purchases, false), nullif(trim(coalesce(p_note, '')), ''),
    auth.uid(), coalesce(nullif(lower(coalesce(auth.jwt() ->> 'email', '')), ''), 'system'))
  returning * into saved;
  return saved;
end $$;

-- p_changes keys (all optional): name, effective_to, default_for_sales, default_for_purchases, note.
create function public.finance_update_tax_rate(p_id uuid, p_changes jsonb)
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
  if r.default_for_sales then update public.tax_rates set default_for_sales = false where default_for_sales and id <> r.id; end if;
  if r.default_for_purchases then update public.tax_rates set default_for_purchases = false where default_for_purchases and id <> r.id; end if;
  update public.tax_rates set name = r.name, effective_to = r.effective_to, note = r.note,
    default_for_sales = r.default_for_sales, default_for_purchases = r.default_for_purchases
  where id = r.id returning * into r;
  return r;
end $$;

-- Sets (or clears, with p_tax_rate_id null) the VAT rate of one transaction.
-- p_target: 'sales' or 'main_partner' (a trip), 'partner_cost', 'expense'.
create function public.finance_set_transaction_tax(p_target text, p_id uuid, p_tax_rate_id uuid)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  perform public.finance_require('manage_finance');
  if p_target = 'sales' then
    update public.booking_financial_lines set sales_tax_rate_id = p_tax_rate_id where id = p_id
      returning jsonb_build_object('id', id, 'tax_rate_id', sales_tax_rate_id, 'tax_percent', sales_tax_percent, 'tax_amount', sales_tax_amount, 'tax_usd', sales_tax_usd) into result;
  elsif p_target = 'main_partner' then
    update public.booking_financial_lines set purchase_tax_rate_id = p_tax_rate_id where id = p_id
      returning jsonb_build_object('id', id, 'tax_rate_id', purchase_tax_rate_id, 'tax_percent', purchase_tax_percent, 'tax_amount', purchase_tax_amount, 'tax_usd', purchase_tax_usd) into result;
  elsif p_target = 'partner_cost' then
    update public.booking_line_partner_costs set tax_rate_id = p_tax_rate_id where id = p_id and status = 'active'
      returning jsonb_build_object('id', id, 'tax_rate_id', tax_rate_id, 'tax_percent', tax_percent, 'tax_amount', tax_amount, 'tax_usd', tax_usd) into result;
  elsif p_target = 'expense' then
    update public.expenses set tax_rate_id = p_tax_rate_id where id = p_id and voided_at is null
      returning jsonb_build_object('id', id, 'tax_rate_id', tax_rate_id, 'tax_percent', tax_percent, 'tax_amount', tax_amount, 'tax_usd', tax_usd) into result;
  else
    raise exception 'Unknown VAT target %.', p_target using errcode = '22023';
  end if;
  if result is null then raise exception 'Transaction not found (or removed / voided).' using errcode = 'P0002'; end if;
  return result;
end $$;

-- ---------------------------------------------------------------------------
-- Access.
-- ---------------------------------------------------------------------------
alter table public.tax_rates enable row level security;
create policy "Finance staff read tax rates" on public.tax_rates for select to authenticated using (public.admin_has_permission('view_finance'));
revoke all on public.tax_rates from anon, authenticated;
grant select on public.tax_rates to authenticated;
grant all on public.tax_rates to service_role;
revoke all on public.finance_vat_summary from anon, authenticated;
grant select on public.finance_vat_summary to authenticated, service_role;

revoke all on function public.finance_tax_percent(uuid, text, date) from public, anon, authenticated;
revoke all on function public.finance_default_tax_rate(text, date) from public, anon, authenticated;
grant execute on function public.finance_tax_amount(numeric, numeric) to authenticated, service_role;
do $$
declare fn text;
begin
  foreach fn in array array[
    'public.finance_create_tax_rate(text, text, numeric, text, date, date, boolean, boolean, text)',
    'public.finance_update_tax_rate(uuid, jsonb)',
    'public.finance_set_transaction_tax(text, uuid, uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end $$;
