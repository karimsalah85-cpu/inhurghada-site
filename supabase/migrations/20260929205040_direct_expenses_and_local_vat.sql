-- Finance phase 6: expenses linked to a tour, and the VAT return in the
-- country's own currency.
--
-- DIRECT EXPENSES: an expense can already be linked to one booking; it can
-- now instead be linked to one tour (e.g. snorkel gear for Giftun trips).
-- Never both, so it is never counted twice. The reports subtract linked
-- expenses from the margin of their booking / tour (excluding deductible VAT).
--
-- VAT IN LOCAL CURRENCY: returns are filed in EGP (SAR in Saudi Arabia). Each
-- VAT amount already in that currency is used as is; any other is converted
-- from its USD value at the rate on its tax-point date.

alter table public.expenses add column tour_slug text
  check (tour_slug is null or tour_slug ~ '^[a-z0-9][a-z0-9-]{0,99}$');
alter table public.expenses add constraint expenses_one_direct_link check (booking_id is null or tour_slug is null);
create index expenses_tour_slug_idx on public.expenses (tour_slug) where tour_slug is not null;

alter table public.tax_jurisdictions add column currency public.finance_currency;
update public.tax_jurisdictions set currency = case country when 'EG' then 'EGP' when 'SA' then 'SAR' else 'USD' end::public.finance_currency;
alter table public.tax_jurisdictions alter column currency set not null;

drop view public.finance_vat_summary;
create view public.finance_vat_summary with (security_invoker = true) as
with taxed_lines as (
  select l.id, l.booking_id, l.trip_date, public.finance_trip_country(l.destination) as country, l.currency,
    l.sales_tax_amount as vat, l.sales_tax_usd as vat_usd,
    sum(l.recognised_revenue) over (partition by l.booking_id) as booking_revenue
  from public.booking_financial_lines l
  where l.included and l.trip_date is not null and l.sales_tax_amount <> 0
),
advance as (
  select t.id as line_id, t.country, t.currency, g.paid_on,
    round(t.vat * g.applied_amount / t.booking_revenue, 2) as vat,
    round(t.vat_usd * g.applied_amount / t.booking_revenue, 2) as vat_usd
  from taxed_lines t join public.guest_payments g on g.booking_id = t.booking_id and g.paid_on < t.trip_date
  where t.booking_revenue > 0
),
items as (
  select a.country, a.paid_on as tax_date, 'output' as side, a.currency, a.vat, a.vat_usd from advance a
  union all
  select t.country, t.trip_date, 'output', t.currency,
    t.vat - coalesce((select sum(a.vat) from advance a where a.line_id = t.id), 0),
    t.vat_usd - coalesce((select sum(a.vat_usd) from advance a where a.line_id = t.id), 0)
  from taxed_lines t
  union all
  select public.finance_trip_country(l.destination), l.trip_date, 'input', l.supplier_cost_currency, l.purchase_tax_amount, l.purchase_tax_usd
  from public.booking_financial_lines l where l.included and l.trip_date is not null and l.purchase_tax_amount <> 0
  union all
  select public.finance_trip_country(l.destination), c.trip_date, 'input', c.currency, c.tax_amount, c.tax_usd
  from public.booking_line_partner_costs c join public.booking_financial_lines l on l.id = c.line_id
  where c.trip_date is not null and c.tax_amount <> 0
  union all
  select public.finance_home_country(), e.expense_date, 'input', e.currency, e.tax_amount, e.tax_usd
  from public.expenses e where e.voided_at is null and e.tax_amount <> 0
),
local_items as (
  select i.*, date_trunc('month', i.tax_date)::date as month, j.currency as local_currency,
    case when i.currency = j.currency then i.vat
      when i.vat_usd is null then null
      else round(i.vat_usd / (public.finance_fx_lookup(j.currency, i.tax_date)).usd_per_unit, 2) end as vat_local
  from items i join public.tax_jurisdictions j on j.country = i.country
  where i.vat_usd is null or i.vat <> 0 or i.side = 'input'
),
months as (
  select country, month, local_currency,
    coalesce(sum(vat_usd) filter (where side = 'output'), 0) as output_vat_usd,
    coalesce(sum(vat_usd) filter (where side = 'input'), 0) as input_vat_usd,
    coalesce(sum(vat_local) filter (where side = 'output'), 0) as output_vat_local,
    coalesce(sum(vat_local) filter (where side = 'input'), 0) as input_vat_local,
    count(*) filter (where side = 'output' and vat <> 0) as output_items,
    count(*) filter (where side = 'input') as input_items,
    count(*) filter (where vat_usd is null) as usd_pending,
    count(*) filter (where vat_local is null) as local_pending
  from local_items
  group by country, month, local_currency
)
select m.country, j.name as country_name, m.month,
  m.output_vat_usd, m.input_vat_usd, m.output_vat_usd - m.input_vat_usd as net_vat_usd,
  m.output_items, m.input_items, m.usd_pending,
  j.filing_frequency,
  p.period_start,
  (p.period_start + (case when j.filing_frequency = 'quarterly' then 3 else 1 end + j.filing_due_months) * interval '1 month' - interval '1 day')::date as filing_due_on,
  m.local_currency::text as local_currency,
  m.output_vat_local, m.input_vat_local, m.output_vat_local - m.input_vat_local as net_vat_local,
  m.local_pending
from months m
join public.tax_jurisdictions j on j.country = m.country
cross join lateral (select date_trunc(case when j.filing_frequency = 'quarterly' then 'quarter' else 'month' end, m.month)::date as period_start) p;

revoke all on public.finance_vat_summary from anon, authenticated;
grant select on public.finance_vat_summary to authenticated, service_role;
