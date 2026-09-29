-- Finance phase 4: one list of every money event (for the accountant's CSV)
-- and monthly cash in vs cash out derived from it, so the two always agree.
--
-- finance_transactions, one row per:
--   * trip sale (accrual, by trip date): recognised revenue of each included trip
--   * guest payment entry: deposits, balances, refunds, credit notes, reversals
--   * partner ledger entry: what partners are owed / owe, payments, settlements,
--     adjustments and reversals (amount: positive = the partner owes Daily Red Sea)
--   * expense (voided expenses are listed, flagged, with no cash effect)
-- amount / currency are as recorded; amount_usd at the stored rate.
-- is_cash marks real money movements (guest payments and refunds other than
-- credit notes, payments / receipts / settlements with partners, expenses that
-- are not voided). cash_effect_usd is their effect on Daily Red Sea's cash:
-- positive = money in, negative = money out (NULL while the USD rate is
-- missing, and for every row that is not cash).

create view public.finance_transactions with (security_invoker = true) as
select
  l.trip_date as occurred_on,
  'trip_sale'::text as kind,
  'sales'::text as category,
  l.booking_id,
  f.reference,
  b.customer_name as counterparty,
  concat_ws(' · ', l.tour_name, l.destination, case when l.outcome <> 'active' then l.outcome::text end) as description,
  l.currency::text as currency,
  l.recognised_revenue as amount,
  l.fx_rate_to_usd,
  l.net_sales_usd as amount_usd,
  l.sales_tax_amount as vat_amount,
  l.sales_tax_usd as vat_usd,
  null::text as method,
  null::numeric as cash_effect_usd,
  false as is_cash,
  false as is_reversal,
  false as voided,
  l.id as source_id,
  'booking_financial_lines'::text as source_table,
  null::text as created_by_email,
  l.updated_at as recorded_at
from public.booking_financial_lines l
join public.booking_financials f on f.booking_id = l.booking_id
join public.bookings b on b.id = l.booking_id
where l.included and l.trip_date is not null

union all
select
  p.paid_on, 'guest_' || p.kind::text, 'guests', p.booking_id, b.reference, b.customer_name,
  concat_ws(' · ', case when p.is_reversal then 'Reversal' end, p.reference, p.note),
  p.currency::text, p.amount, p.fx_rate_to_usd, p.amount_usd, 0::numeric, 0::numeric, p.method::text,
  case when p.method = 'credit_note' then null else p.amount_usd end,
  p.method <> 'credit_note',
  p.is_reversal, false, p.id, 'guest_payments', p.created_by_email, p.created_at
from public.guest_payments p
join public.bookings b on b.id = p.booking_id

union all
select
  e.entry_date, 'partner_' || e.entry_type::text, 'partners', e.booking_id, f.reference, s.name,
  concat_ws(' · ', case when e.reverses_entry_id is not null then 'Reversal of ' || coalesce(o.entry_type::text, '') end, e.note),
  e.currency::text, e.amount, e.fx_rate_to_usd, e.amount_usd, 0::numeric, 0::numeric, null::text,
  case when coalesce(o.entry_type, e.entry_type) in ('payment_to_supplier', 'commission_received_from_supplier', 'net_settlement')
    then -e.amount_usd end,
  coalesce(o.entry_type, e.entry_type) in ('payment_to_supplier', 'commission_received_from_supplier', 'net_settlement'),
  e.reverses_entry_id is not null, false, e.id, 'supplier_ledger', e.created_by_email, e.created_at
from public.supplier_ledger e
join public.suppliers s on s.id = e.supplier_id
left join public.supplier_ledger o on o.id = e.reverses_entry_id
left join public.booking_financials f on f.booking_id = e.booking_id

union all
select
  x.expense_date, 'expense', 'expenses', x.booking_id, f.reference, coalesce(x.vendor, x.category),
  concat_ws(' · ', x.description, x.expense_type, case when x.voided_at is not null then 'VOIDED: ' || x.void_reason end),
  x.currency::text, x.amount, x.fx_rate_to_usd, x.amount_usd, x.tax_amount, x.tax_usd, x.source,
  case when x.voided_at is null then -x.amount_usd end,
  x.voided_at is null,
  false, x.voided_at is not null, x.id, 'expenses', null::text, x.created_at
from public.expenses x
left join public.booking_financials f on f.booking_id = x.booking_id;

-- Cash in vs cash out per month (USD), from the cash rows above.
-- usd_pending counts cash movements with no USD value yet (no exchange rate),
-- which are therefore not in the sums.
create view public.finance_cash_flow with (security_invoker = true) as
select date_trunc('month', t.occurred_on)::date as month,
  coalesce(sum(t.cash_effect_usd) filter (where t.cash_effect_usd > 0), 0) as cash_in_usd,
  coalesce(-sum(t.cash_effect_usd) filter (where t.cash_effect_usd < 0), 0) as cash_out_usd,
  coalesce(sum(t.cash_effect_usd), 0) as net_cash_usd,
  coalesce(sum(t.cash_effect_usd) filter (where t.category = 'guests'), 0) as guests_net_usd,
  coalesce(sum(t.cash_effect_usd) filter (where t.category = 'partners'), 0) as partners_net_usd,
  coalesce(sum(t.cash_effect_usd) filter (where t.category = 'expenses'), 0) as expenses_net_usd,
  count(*) filter (where t.cash_effect_usd is null) as usd_pending
from public.finance_transactions t
where t.is_cash
group by 1;

revoke all on public.finance_transactions, public.finance_cash_flow from anon, authenticated;
grant select on public.finance_transactions, public.finance_cash_flow to authenticated, service_role;
