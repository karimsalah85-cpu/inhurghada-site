-- Finance phase 2: several partners per trip.
--
-- Each financial line (one trip) keeps its MAIN partner exactly as before
-- (supplier_id / supplier_cost / collected_by): the partner who may collect
-- the guest's money, with the automatic payable or receivable it already has.
-- EXTRA partners (a guide, a driver, a hotel ...) are rows in
-- booking_line_partner_costs, each with its own cost, currency and
-- cancellation fee. Daily Red Sea always pays extra partners itself, so each
-- row gets one automatic supplier_cost_payable ledger entry (tagged with
-- partner_cost_id), reversed and reposted whenever it changes.
--
-- RECOGNITION of an extra partner's cost follows its trip exactly like the
-- main partner's: the full cost while the trip is active / completed / no-show
-- (and not fully refunded), only the cancellation fee once it is cancelled,
-- nothing while it is pending or excluded. Removing a partner keeps the row
-- (status 'removed') and reverses what they were owed.
--
-- MARGIN: drs_commission / margin (booking currency and USD) now subtract
-- extra partners too; total_partner_cost_usd = main + extra partners, which is
-- what the P&L reports as partner (supplier) costs.

create table public.booking_line_partner_costs (
  id uuid primary key default gen_random_uuid(),
  line_id uuid not null references public.booking_financial_lines(id) on delete restrict,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  role text not null check (role in ('boat', 'guide', 'driver', 'hotel', 'company', 'other')),
  cost numeric(14,2) not null check (cost >= 0),
  currency public.finance_currency not null,
  cancellation_fee numeric(14,2) not null default 0 check (cancellation_fee >= 0),
  cost_source text not null default 'manual' check (cost_source in ('manual', 'supplier_price')),
  status text not null default 'active' check (status in ('active', 'removed')),
  removed_at timestamptz,
  removed_reason text,
  note text check (note is null or length(note) <= 500),
  -- trip-date FX, kept so reports never move once the rate is final
  trip_date date,
  fx_rate_to_usd numeric(20,12),
  fx_rate_date date,
  fx_locked boolean not null default false,
  -- recognised (computed by trigger)
  recognised_cost numeric(14,2) not null default 0,
  recognised_cost_booking_ccy numeric(14,2),
  recognised_cost_usd numeric(14,2),
  created_by uuid,
  created_by_email text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'removed') = (removed_at is not null)),
  check (status <> 'removed' or length(trim(coalesce(removed_reason, ''))) >= 3)
);
create unique index booking_line_partner_costs_active_unique on public.booking_line_partner_costs (line_id, supplier_id) where status = 'active';
create index booking_line_partner_costs_line_idx on public.booking_line_partner_costs (line_id);
create index booking_line_partner_costs_supplier_idx on public.booking_line_partner_costs (supplier_id);

alter table public.booking_financial_lines
  add column extra_partner_cost_booking_ccy numeric(14,2) default 0,
  add column extra_partner_cost_usd numeric(14,2) default 0,
  add column total_partner_cost_usd numeric(14,2);

alter table public.supplier_ledger
  add column partner_cost_id uuid references public.booking_line_partner_costs(id) on delete restrict;
create index supplier_ledger_partner_cost_idx on public.supplier_ledger (partner_cost_id) where partner_cost_id is not null;

-- ---------------------------------------------------------------------------
-- Extra partner rows: recognition from their trip.
-- ---------------------------------------------------------------------------
create function public.partner_cost_before_write() returns trigger
language plpgsql set search_path = '' as $$
declare l public.booking_financial_lines; fx record; cost_applies boolean;
begin
  if tg_op = 'UPDATE' and old.status = 'removed'
     and (to_jsonb(new) - array['updated_at', 'trip_date', 'fx_rate_to_usd', 'fx_rate_date', 'fx_locked', 'recognised_cost', 'recognised_cost_booking_ccy', 'recognised_cost_usd'])
      <> (to_jsonb(old) - array['updated_at', 'trip_date', 'fx_rate_to_usd', 'fx_rate_date', 'fx_locked', 'recognised_cost', 'recognised_cost_booking_ccy', 'recognised_cost_usd']) then
    raise exception 'A removed partner cannot be changed; add the partner again instead.' using errcode = '55000';
  end if;
  select * into l from public.booking_financial_lines where id = new.line_id;
  new.booking_id := l.booking_id;

  if tg_op = 'INSERT' or not new.fx_locked or new.fx_rate_to_usd is null
     or new.currency is distinct from old.currency or l.trip_date is distinct from new.trip_date then
    select * into fx from public.finance_fx_lookup(new.currency, l.trip_date);
    new.fx_rate_to_usd := fx.usd_per_unit; new.fx_rate_date := fx.rate_date; new.fx_locked := coalesce(fx.locked, false);
  end if;
  new.trip_date := l.trip_date;

  cost_applies := l.included and l.outcome in ('active', 'completed', 'no_show')
    and (l.net_selling_price = 0 or l.refunded_amount < l.net_selling_price);
  new.recognised_cost := case
    when new.status = 'removed' or not l.included then 0
    when cost_applies then new.cost
    else new.cancellation_fee end;
  new.recognised_cost_usd := public.finance_to_usd(new.recognised_cost, new.fx_rate_to_usd);
  new.recognised_cost_booking_ccy := case
    when new.recognised_cost = 0 then 0
    when new.currency = l.currency then new.recognised_cost
    when new.fx_rate_to_usd is null or l.fx_rate_to_usd is null then null
    else round(new.recognised_cost * new.fx_rate_to_usd / l.fx_rate_to_usd, 2) end;
  if new.recognised_cost = 0 then new.recognised_cost_usd := 0; end if;
  new.updated_at := now();
  return new;
end $$;

-- Totals of a trip's extra partners, fed back into the trip's margin. NULL
-- while any cost with a value still has no exchange rate.
create function public.finance_refresh_line_partner_totals(p_line_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_ccy numeric; v_usd numeric;
begin
  select case when bool_or(recognised_cost_booking_ccy is null) then null else coalesce(sum(recognised_cost_booking_ccy), 0) end,
         case when bool_or(recognised_cost_usd is null) then null else coalesce(sum(recognised_cost_usd), 0) end
  into v_ccy, v_usd
  from public.booking_line_partner_costs where line_id = p_line_id;
  v_ccy := case when v_ccy is null and not exists (select 1 from public.booking_line_partner_costs where line_id = p_line_id) then 0 else v_ccy end;
  v_usd := case when v_usd is null and not exists (select 1 from public.booking_line_partner_costs where line_id = p_line_id) then 0 else v_usd end;
  update public.booking_financial_lines set extra_partner_cost_booking_ccy = v_ccy, extra_partner_cost_usd = v_usd
  where id = p_line_id and (extra_partner_cost_booking_ccy, extra_partner_cost_usd) is distinct from (v_ccy, v_usd);
end $$;

-- One automatic payable per extra partner row (Daily Red Sea owes them).
create function public.finance_sync_partner_cost_ledger(p_partner_cost_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  c public.booking_line_partner_costs;
  want_amount numeric := 0;
  want_rate numeric;
  want_rate_date date;
  want_usd numeric;
  current_entry record;
  matched boolean := false;
begin
  select * into c from public.booking_line_partner_costs where id = p_partner_cost_id;
  if not found then return; end if;
  want_amount := -c.recognised_cost;
  if c.fx_locked and c.recognised_cost_usd is not null then
    want_rate := c.fx_rate_to_usd; want_rate_date := c.fx_rate_date; want_usd := -c.recognised_cost_usd;
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
      format('Automatic: %s on trip %s%s', c.role, l.line_no, case when want_usd is null then ' (USD pending final trip-date rate)' else '' end)
    from public.booking_financial_lines l where l.id = c.line_id;
  end if;
end $$;

create function public.partner_cost_after_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.finance_sync_partner_cost_ledger(new.id);
  perform public.finance_refresh_line_partner_totals(new.line_id);
  return null;
end $$;

create function public.partner_cost_no_delete() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'Partner costs are never deleted; remove the partner from the trip instead.' using errcode = '55000';
end $$;

create trigger booking_line_partner_costs_before_write before insert or update on public.booking_line_partner_costs
  for each row execute function public.partner_cost_before_write();
create trigger booking_line_partner_costs_after_write after insert or update on public.booking_line_partner_costs
  for each row execute function public.partner_cost_after_write();
create trigger booking_line_partner_costs_no_delete before delete on public.booking_line_partner_costs
  for each row execute function public.partner_cost_no_delete();
create trigger booking_line_partner_costs_no_truncate before truncate on public.booking_line_partner_costs
  for each statement execute function public.finance_block_delete();
create trigger booking_line_partner_costs_audit after insert or update on public.booking_line_partner_costs
  for each row execute function public.finance_audit_trigger('id');

-- ---------------------------------------------------------------------------
-- Trips: margins subtract extra partners; extra partners follow the trip.
-- ---------------------------------------------------------------------------
create or replace function public.finance_line_before_write() returns trigger
language plpgsql set search_path = '' as $$
declare
  fx record;
  net numeric;
  revenue_basis boolean;
  cost_applies boolean;
  charged_only boolean;
  charged numeric;
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
    new.refunded_amount := case
      when new.payments_recorded then least(new.payments_refunded, net)
      when new.payment_status = 'refunded' then net
      else 0 end;
  end if;
  if new.refunded_amount > net then
    raise exception 'Refunded amount (%) cannot exceed the net selling price (%).', new.refunded_amount, net using errcode = '23514';
  end if;

  -- A cancelled trip with recorded payments is charged only what the guest paid.
  charged_only := new.outcome = 'cancelled' and new.payments_recorded;
  charged := least(greatest(new.payments_received, 0), net);

  new.included := new.excluded_reason is null and new.outcome not in ('pending', 'removed');
  revenue_basis := new.included and (new.outcome in ('active', 'completed', 'no_show')
    or (new.outcome = 'cancelled' and (case when charged_only then charged > 0 else new.payment_status in ('paid', 'refunded') end)));
  cost_applies := new.included and new.outcome in ('active', 'completed', 'no_show') and (net = 0 or new.refunded_amount < net);

  new.recognised_gross := case when not revenue_basis then 0 when charged_only then charged else new.selling_price end;
  new.recognised_discount := case when revenue_basis and not charged_only then new.discount_amount else 0 end;
  new.recognised_refund := case when not revenue_basis then 0 when charged_only then least(new.refunded_amount, charged) else new.refunded_amount end;
  new.recognised_revenue := new.recognised_gross - new.recognised_discount - new.recognised_refund;
  new.recognised_supplier_cost := case when cost_applies then new.supplier_cost when new.included then new.supplier_cancellation_fee else 0 end;
  new.recognised_agent_commission := case when cost_applies then new.agent_commission else 0 end;
  new.recognised_payment_fees := case when new.included then new.payment_fees else 0 end;

  new.recognised_supplier_cost_booking_ccy := case
    when new.supplier_cost_currency = new.currency then new.recognised_supplier_cost
    when new.fx_missing then null
    else round(new.recognised_supplier_cost * new.supplier_fx_rate_to_usd / new.fx_rate_to_usd, 2) end;
  -- Extra partners (null while one of their rates is missing).
  new.drs_commission := new.recognised_revenue - new.recognised_supplier_cost_booking_ccy
    - new.extra_partner_cost_booking_ccy - new.recognised_agent_commission;
  new.margin_amount := new.drs_commission - new.recognised_payment_fees;
  new.margin_pct := case when new.recognised_revenue > 0 and new.margin_amount is not null
    then round(new.margin_amount / new.recognised_revenue * 100, 2) end;

  new.gross_usd := public.finance_to_usd(new.recognised_gross, new.fx_rate_to_usd);
  new.discount_usd := public.finance_to_usd(new.recognised_discount, new.fx_rate_to_usd);
  new.refund_usd := public.finance_to_usd(new.recognised_refund, new.fx_rate_to_usd);
  new.net_sales_usd := new.gross_usd - new.discount_usd - new.refund_usd;
  new.supplier_cost_usd := public.finance_to_usd(new.recognised_supplier_cost, new.supplier_fx_rate_to_usd);
  new.total_partner_cost_usd := new.supplier_cost_usd + new.extra_partner_cost_usd;
  new.agent_commission_usd := public.finance_to_usd(new.recognised_agent_commission, new.fx_rate_to_usd);
  new.payment_fees_usd := public.finance_to_usd(new.recognised_payment_fees, new.fx_rate_to_usd);
  new.drs_commission_usd := new.net_sales_usd - new.total_partner_cost_usd - new.agent_commission_usd;
  new.margin_amount_usd := new.drs_commission_usd - new.payment_fees_usd;
  new.margin_pct_usd := case when new.net_sales_usd > 0 and new.margin_amount_usd is not null
    then round(new.margin_amount_usd / new.net_sales_usd * 100, 2) end;

  new.updated_at := now();
  return new;
end $$;

create or replace function public.finance_line_after_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.finance_sync_line_ledger(new.id);
  -- Extra partners follow their trip's outcome, refund, date and rates.
  if tg_op = 'UPDATE' and (old.outcome, old.included, old.net_selling_price, old.refunded_amount, old.trip_date, old.currency, old.fx_rate_to_usd)
       is distinct from (new.outcome, new.included, new.net_selling_price, new.refunded_amount, new.trip_date, new.currency, new.fx_rate_to_usd) then
    update public.booking_line_partner_costs set updated_at = now() where line_id = new.id;
  end if;
  return null;
end $$;

-- The main partner's automatic entries are the ones without partner_cost_id.
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
  current_entry record;
  matched boolean := false;
begin
  select * into l from public.booking_financial_lines where id = p_line_id;
  if not found then return; end if;

  if l.included and l.supplier_id is not null then
    if l.collected_by = 'daily_red_sea' then
      want_type := 'supplier_cost_payable';
      want_amount := -l.recognised_supplier_cost;
      want_currency := l.supplier_cost_currency;
      if l.supplier_fx_locked and l.supplier_cost_usd is not null then
        want_rate := l.supplier_fx_rate_to_usd;
        want_rate_date := l.supplier_fx_rate_date;
        want_usd := -l.supplier_cost_usd;
      end if;
    elsif l.recognised_supplier_cost_booking_ccy is not null
          and (l.supplier_cost_currency = l.currency or (l.fx_locked and l.supplier_fx_locked)) then
      want_type := 'commission_receivable';
      want_amount := l.recognised_revenue - l.recognised_supplier_cost_booking_ccy;
      want_currency := l.currency;
      if l.fx_locked and l.supplier_fx_locked and l.net_sales_usd is not null and l.supplier_cost_usd is not null then
        want_rate := l.fx_rate_to_usd;
        want_rate_date := l.fx_rate_date;
        want_usd := l.net_sales_usd - l.supplier_cost_usd;
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
      format('Automatic: %s, trip %s%s', case when want_type = 'supplier_cost_payable' then 'Daily Red Sea collected' else 'supplier collected' end,
        l.line_no, case when want_usd is null then ' (USD pending final trip-date rate)' else '' end));
  end if;
end $$;

-- Reversals also carry the partner cost they reverse.
create or replace function public.supplier_ledger_before_insert() returns trigger
language plpgsql set search_path = '' as $$
declare original public.supplier_ledger; fx record;
begin
  new.created_by := coalesce(new.created_by, auth.uid());
  if new.created_by_email is null or new.created_by_email = 'system' then
    new.created_by_email := coalesce(nullif(lower(coalesce(auth.jwt() ->> 'email', '')), ''), 'system');
  end if;
  if new.entry_type = 'reversal' then
    select * into original from public.supplier_ledger where id = new.reverses_entry_id;
    if not found then raise exception 'The entry being reversed does not exist.' using errcode = '23503'; end if;
    if original.entry_type = 'reversal' then raise exception 'A reversal cannot itself be reversed.' using errcode = '23514'; end if;
    new.supplier_id := original.supplier_id;
    new.booking_id := original.booking_id;
    new.line_id := original.line_id;
    new.partner_cost_id := original.partner_cost_id;
    new.amount := -original.amount;
    new.currency := original.currency;
    new.fx_rate_to_usd := original.fx_rate_to_usd;
    new.fx_rate_date := original.fx_rate_date;
    new.amount_usd := -original.amount_usd;
    new.settlement_id := original.settlement_id;
    return new;
  end if;
  if new.is_automatic then
    -- Automatic entries carry the line's own locked USD value (or none yet).
    if new.amount_usd is not null and new.fx_rate_to_usd is null then
      raise exception 'Automatic entries with a USD value must record the rate used.' using errcode = '23514';
    end if;
    return new;
  end if;
  if new.fx_rate_to_usd is null then
    select * into fx from public.finance_fx_lookup(new.currency, new.entry_date);
    new.fx_rate_to_usd := fx.usd_per_unit;
    new.fx_rate_date := fx.rate_date;
  end if;
  new.amount_usd := public.finance_to_usd(new.amount, new.fx_rate_to_usd);
  return new;
end $$;

-- Existing trips: total partner cost = main partner until extras are added.
update public.booking_financial_lines set total_partner_cost_usd = supplier_cost_usd where total_partner_cost_usd is null;

-- Provisional extra-partner rates are refreshed with everything else.
create or replace function public.finance_refresh_unlocked_fx() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare lines_updated integer; expenses_updated integer; payments_updated integer; partners_updated integer;
begin
  update public.booking_financial_lines set updated_at = now() where not fx_locked or not supplier_fx_locked;
  get diagnostics lines_updated = row_count;
  update public.expenses set updated_at = now() where not fx_locked and voided_at is null;
  get diagnostics expenses_updated = row_count;
  update public.guest_payments set fx_locked = fx_locked where not fx_locked;
  get diagnostics payments_updated = row_count;
  update public.booking_line_partner_costs set updated_at = now() where not fx_locked;
  get diagnostics partners_updated = row_count;
  return jsonb_build_object('lines', lines_updated, 'expenses', expenses_updated, 'guest_payments', payments_updated, 'partner_costs', partners_updated);
end $$;

-- Cancellation fees owed to every partner count in the cancellation report.
create or replace view public.finance_cancellation_impact with (security_invoker = true) as
select date_trunc('month', l.trip_date)::date as month,
  coalesce(b.cancellation_reason::text, 'unspecified') as reason,
  count(distinct l.booking_id) as bookings,
  sum(public.finance_to_usd(l.net_selling_price, l.fx_rate_to_usd)) - sum(l.net_sales_usd) as lost_sales_usd,
  sum(l.net_sales_usd) as retained_usd,
  sum(l.refund_usd) as refunds_usd,
  sum(l.total_partner_cost_usd) as partner_fees_usd,
  sum(l.payment_fees_usd) as payment_fees_usd,
  sum(l.total_partner_cost_usd) + sum(l.payment_fees_usd) - sum(l.net_sales_usd) as net_cost_usd,
  count(*) filter (where l.fx_missing or l.total_partner_cost_usd is null) as lines_missing_fx
from public.booking_financial_lines l
join public.bookings b on b.id = l.booking_id
where l.outcome = 'cancelled' and l.excluded_reason is null and l.trip_date is not null
group by 1, 2;

-- ---------------------------------------------------------------------------
-- Write RPCs (owner + accountant).
-- ---------------------------------------------------------------------------
-- Adds an extra partner to a trip. p_cost null = use the partner's price for
-- this tour (per person / fixed, or a percentage of the trip's net price).
create function public.finance_add_partner_cost(
  p_line_id uuid, p_supplier_id uuid, p_role text, p_cost numeric default null, p_currency text default null,
  p_cancellation_fee numeric default 0, p_note text default null)
returns public.booking_line_partner_costs
language plpgsql security definer set search_path = '' as $$
declare
  l public.booking_financial_lines;
  s public.suppliers;
  price record;
  v_cost numeric := p_cost;
  v_currency public.finance_currency;
  v_source text := 'manual';
  saved public.booking_line_partner_costs;
begin
  perform public.finance_require('manage_finance');
  select * into l from public.booking_financial_lines where id = p_line_id for update;
  if not found then raise exception 'Trip not found.' using errcode = 'P0002'; end if;
  if l.outcome = 'removed' then raise exception 'This trip was removed from the booking.' using errcode = '22023'; end if;
  select * into s from public.suppliers where id = p_supplier_id;
  if not found then raise exception 'Partner not found.' using errcode = 'P0002'; end if;
  if not s.active then raise exception '% is inactive; reactivate them first.', s.name using errcode = '22023'; end if;
  if l.supplier_id = p_supplier_id then
    raise exception '% is already the main partner on this trip; change the main partner''s cost instead.', s.name using errcode = '22023';
  end if;
  if exists (select 1 from public.booking_line_partner_costs where line_id = l.id and supplier_id = p_supplier_id and status = 'active') then
    raise exception '% is already on this trip.', s.name using errcode = '22023';
  end if;
  if p_cancellation_fee is null or p_cancellation_fee < 0 then raise exception 'The cancellation fee cannot be negative.' using errcode = '22023'; end if;

  if v_cost is null then
    select sp.* into price from public.supplier_prices sp
      where sp.supplier_id = p_supplier_id and sp.tour_slug = l.tour_slug
        and (sp.valid_from is null or l.trip_date is null or sp.valid_from <= l.trip_date)
        and (sp.valid_to is null or l.trip_date is null or sp.valid_to >= l.trip_date)
      order by sp.valid_from desc nulls last limit 1;
    if not found or upper(price.currency) not in ('USD', 'EUR', 'GBP', 'EGP', 'SAR') then
      raise exception '% has no price for this tour; enter the cost.', s.name using errcode = '22023';
    end if;
    v_source := 'supplier_price';
    if price.cost_percent is not null then
      v_cost := round(l.net_selling_price * price.cost_percent / 100, 2);
      v_currency := l.currency;
    else
      v_cost := price.adult_cost * (case when l.adults + l.youth = 0 then l.guests else l.adults end)
        + coalesce(price.youth_cost, price.adult_cost) * l.youth + coalesce(price.fixed_cost, 0);
      v_currency := upper(price.currency)::public.finance_currency;
    end if;
  else
    if v_cost < 0 then raise exception 'The cost cannot be negative.' using errcode = '22023'; end if;
    v_currency := upper(coalesce(nullif(p_currency, ''), nullif(s.default_currency, ''), 'EGP'))::public.finance_currency;
  end if;

  insert into public.booking_line_partner_costs (line_id, booking_id, supplier_id, role, cost, currency, cancellation_fee, cost_source,
    note, created_by, created_by_email)
  values (l.id, l.booking_id, p_supplier_id, coalesce(nullif(p_role, ''), case when s.type in ('boat', 'guide', 'driver', 'hotel', 'company') then s.type else 'other' end),
    v_cost, v_currency, p_cancellation_fee, v_source, nullif(trim(coalesce(p_note, '')), ''), auth.uid(),
    coalesce(nullif(lower(coalesce(auth.jwt() ->> 'email', '')), ''), 'system'))
  returning * into saved;
  select * into saved from public.booking_line_partner_costs where id = saved.id;
  return saved;
end $$;

-- p_changes keys (all optional): cost, currency, cancellation_fee, role, note.
create function public.finance_update_partner_cost(p_id uuid, p_changes jsonb)
returns public.booking_line_partner_costs
language plpgsql security definer set search_path = '' as $$
declare c public.booking_line_partner_costs; unknown text;
begin
  perform public.finance_require('manage_finance');
  if jsonb_typeof(p_changes) <> 'object' then raise exception 'Changes must be an object.' using errcode = '22023'; end if;
  select key into unknown from jsonb_object_keys(p_changes) key where key not in ('cost', 'currency', 'cancellation_fee', 'role', 'note') limit 1;
  if unknown is not null then raise exception 'Unknown field %.', unknown using errcode = '22023'; end if;
  select * into c from public.booking_line_partner_costs where id = p_id for update;
  if not found then raise exception 'Partner cost not found.' using errcode = 'P0002'; end if;
  if c.status = 'removed' then raise exception 'This partner was removed from the trip; add them again instead.' using errcode = '22023'; end if;
  if p_changes ? 'cost' then c.cost := (p_changes ->> 'cost')::numeric; c.cost_source := 'manual'; end if;
  if p_changes ? 'currency' then c.currency := (p_changes ->> 'currency')::public.finance_currency; c.cost_source := 'manual'; end if;
  if p_changes ? 'cancellation_fee' then c.cancellation_fee := (p_changes ->> 'cancellation_fee')::numeric; end if;
  if p_changes ? 'role' then c.role := p_changes ->> 'role'; end if;
  if p_changes ? 'note' then c.note := nullif(trim(coalesce(p_changes ->> 'note', '')), ''); end if;
  update public.booking_line_partner_costs set cost = c.cost, currency = c.currency, cancellation_fee = c.cancellation_fee,
    role = c.role, note = c.note, cost_source = c.cost_source
  where id = c.id returning * into c;
  return c;
end $$;

create function public.finance_remove_partner_cost(p_id uuid, p_reason text)
returns public.booking_line_partner_costs
language plpgsql security definer set search_path = '' as $$
declare c public.booking_line_partner_costs;
begin
  perform public.finance_require('manage_finance');
  if length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'Enter a reason for removing this partner.' using errcode = '22023'; end if;
  update public.booking_line_partner_costs set status = 'removed', removed_at = now(), removed_reason = trim(p_reason)
  where id = p_id and status = 'active' returning * into c;
  if not found then raise exception 'Partner cost not found or already removed.' using errcode = 'P0002'; end if;
  return c;
end $$;

-- ---------------------------------------------------------------------------
-- Access.
-- ---------------------------------------------------------------------------
alter table public.booking_line_partner_costs enable row level security;
create policy "Finance staff read partner costs" on public.booking_line_partner_costs for select to authenticated using (public.admin_has_permission('view_finance'));
revoke all on public.booking_line_partner_costs from anon, authenticated;
grant select on public.booking_line_partner_costs to authenticated;
grant all on public.booking_line_partner_costs to service_role;
revoke all on public.finance_cancellation_impact from anon, authenticated;
grant select on public.finance_cancellation_impact to authenticated, service_role;

do $$
declare fn text;
begin
  foreach fn in array array[
    'public.partner_cost_before_write()', 'public.partner_cost_after_write()', 'public.partner_cost_no_delete()',
    'public.finance_refresh_line_partner_totals(uuid)', 'public.finance_sync_partner_cost_ledger(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;
  foreach fn in array array[
    'public.finance_add_partner_cost(uuid, uuid, text, numeric, text, numeric, text)',
    'public.finance_update_partner_cost(uuid, jsonb)',
    'public.finance_remove_partner_cost(uuid, text)'
  ] loop
    execute format('revoke all on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end $$;
