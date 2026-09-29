-- Finance phase 1: guest money. Deposits, balance payments, refunds and credit
-- notes are recorded per booking in an append-only guest_payments ledger;
-- bookings get a cancellation reason; recorded payments drive the booking's
-- payment status and the refund / retained revenue on its financial lines.
--
-- SIGN CONVENTION (guest_payments.amount, in the currency actually paid):
--   positive = money in from the guest  (deposit, balance, credit_redemption)
--   negative = money back to the guest  (refund, credit_note_issued)
--   A reversal copies the original kind with the opposite sign, so sums per
--   kind always net out. Nothing is ever edited or deleted.
--   applied_amount is the same money in the BOOKING currency (equal to amount
--   when the currencies match; otherwise converted at the payment-date rates,
--   or entered manually as the rate actually used at the desk).
--   amount_usd is the payment converted at the payment-date USD rate (cash
--   basis). While that rate is provisional only the fx columns may change.
--
-- CREDIT NOTES: issuing one is a non-cash refund on the source booking
-- (kind credit_note_issued, method credit_note). Redeeming it is a non-cash
-- payment on the target booking (kind credit_redemption), in the credit
-- note's currency. Cash reports exclude method = 'credit_note'.
--
-- REVENUE (finance lines): once a booking has any guest_payments entry,
-- its refund comes from recorded refunds (allocated across its trips by net
-- price), not from the payment_status flag. For a cancelled booking with
-- payments, the charged amount is what the guest paid (capped at the net
-- price) and revenue is what was kept after refunds. Bookings without
-- recorded payments keep the previous rules.

create type public.finance_guest_entry_kind as enum ('deposit', 'balance', 'refund', 'credit_note_issued', 'credit_redemption');
create type public.finance_payment_method as enum (
  'cash', 'card', 'stripe', 'bank_transfer', 'paypal', 'instapay', 'vodafone_cash', 'credit_note', 'other');
create type public.booking_cancellation_reason as enum ('weather', 'guest', 'partner', 'other');

-- ---------------------------------------------------------------------------
-- Cancellation reason on bookings.
-- ---------------------------------------------------------------------------
alter table public.bookings
  add column cancellation_reason public.booking_cancellation_reason,
  add column cancellation_note text check (cancellation_note is null or length(cancellation_note) <= 500),
  add column cancelled_at timestamptz;

update public.bookings set cancelled_at = updated_at where status = 'cancelled' and cancelled_at is null;

create function public.booking_cancellation_before_write() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'cancelled' then
    if tg_op = 'INSERT' or old.status is distinct from 'cancelled' or new.cancelled_at is null then
      new.cancelled_at := coalesce(new.cancelled_at, now());
    end if;
  else
    new.cancelled_at := null;
    new.cancellation_reason := null;
    new.cancellation_note := null;
  end if;
  return new;
end $$;
revoke all on function public.booking_cancellation_before_write() from public, anon, authenticated;
create trigger bookings_cancellation_before_write before insert or update on public.bookings
  for each row execute function public.booking_cancellation_before_write();

-- The money audit now also records the cancellation reason.
create or replace function public.finance_booking_money_audit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  before_row jsonb := case when tg_op = 'UPDATE' then jsonb_build_object(
    'reference', old.reference, 'amount', old.amount, 'currency', old.currency, 'subtotal', old.subtotal,
    'discount_amount', old.discount_amount, 'status', old.status, 'payment_status', old.payment_status,
    'archived_at', old.archived_at, 'sales_person_id', old.sales_person_id,
    'sales_commission_percent', old.sales_commission_percent,
    'cancellation_reason', old.cancellation_reason, 'cancellation_note', old.cancellation_note) end;
  after_row jsonb := jsonb_build_object(
    'reference', new.reference, 'amount', new.amount, 'currency', new.currency, 'subtotal', new.subtotal,
    'discount_amount', new.discount_amount, 'status', new.status, 'payment_status', new.payment_status,
    'archived_at', new.archived_at, 'sales_person_id', new.sales_person_id,
    'sales_commission_percent', new.sales_commission_percent,
    'cancellation_reason', new.cancellation_reason, 'cancellation_note', new.cancellation_note);
begin
  if tg_op = 'UPDATE' and before_row = after_row then return null; end if;
  insert into public.admin_audit_log (actor_id, actor_email, action, resource_type, resource_id, summary, before_data, after_data)
  values (
    auth.uid(),
    coalesce(nullif(lower(coalesce(auth.jwt() ->> 'email', '')), ''), 'system'),
    lower(tg_op),
    'bookings',
    new.id::text,
    format('Booking %s money fields %s', new.reference, case when tg_op = 'INSERT' then 'created' else 'changed' end),
    before_row,
    after_row
  );
  return null;
end $$;

-- ---------------------------------------------------------------------------
-- Credit notes.
-- ---------------------------------------------------------------------------
create sequence public.credit_note_number_seq;

create table public.credit_notes (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  customer_name text,
  customer_email text,
  customer_phone text,
  currency public.finance_currency not null,
  amount numeric(14,2) not null check (amount > 0),
  issued_on date not null,
  expires_on date check (expires_on is null or expires_on >= issued_on),
  reason text not null check (length(trim(reason)) >= 3 and length(reason) <= 500),
  voided_at timestamptz,
  voided_by uuid,
  void_reason text,
  created_by uuid,
  created_by_email text not null default 'system',
  created_at timestamptz not null default now(),
  check ((voided_at is null) = (void_reason is null))
);
create index credit_notes_booking_idx on public.credit_notes (booking_id);
create index credit_notes_customer_email_idx on public.credit_notes (lower(customer_email));

-- Only the void fields can ever be set (once).
create function public.credit_notes_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op <> 'UPDATE' then raise exception 'credit_notes are never deleted; void them instead.' using errcode = '55000'; end if;
  if old.voided_at is not null then raise exception 'This credit note is already void.' using errcode = '55000'; end if;
  if (to_jsonb(new) - array['voided_at', 'voided_by', 'void_reason']) <> (to_jsonb(old) - array['voided_at', 'voided_by', 'void_reason']) then
    raise exception 'A credit note cannot be changed; void it and issue a new one.' using errcode = '55000';
  end if;
  return new;
end $$;
revoke all on function public.credit_notes_guard() from public, anon, authenticated;
create trigger credit_notes_guard before update or delete on public.credit_notes
  for each row execute function public.credit_notes_guard();
create trigger credit_notes_no_truncate before truncate on public.credit_notes
  for each statement execute function public.finance_block_delete();
create trigger credit_notes_audit after insert or update on public.credit_notes
  for each row execute function public.finance_audit_trigger('id');

-- ---------------------------------------------------------------------------
-- Guest payments ledger.
-- ---------------------------------------------------------------------------
create table public.guest_payments (
  id uuid primary key default gen_random_uuid(),
  entry_no bigint generated always as identity unique,
  idempotency_key uuid unique,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  kind public.finance_guest_entry_kind not null,
  method public.finance_payment_method not null,
  amount numeric(14,2) not null check (amount <> 0),
  currency public.finance_currency not null,
  booking_currency public.finance_currency not null,
  applied_amount numeric(14,2) not null check (applied_amount <> 0),
  applied_rate numeric(20,10) not null check (applied_rate > 0),
  paid_on date not null,
  fx_rate_to_usd numeric(20,12),
  fx_rate_date date,
  fx_locked boolean not null default false,
  amount_usd numeric(14,2),
  credit_note_id uuid references public.credit_notes(id) on delete restrict,
  is_reversal boolean not null default false,
  reverses_entry_id uuid unique references public.guest_payments(id) on delete restrict,
  reference text check (reference is null or length(reference) <= 120),
  note text check (note is null or length(note) <= 1000),
  created_by uuid,
  created_by_email text not null default 'system',
  created_at timestamptz not null default now(),
  check (is_reversal = (reverses_entry_id is not null)),
  check (((kind in ('deposit', 'balance', 'credit_redemption')) = (amount > 0)) <> is_reversal),
  check (sign(amount) = sign(applied_amount)),
  check ((kind in ('credit_note_issued', 'credit_redemption')) = (method = 'credit_note')),
  check ((kind in ('credit_note_issued', 'credit_redemption')) = (credit_note_id is not null)),
  check (not is_reversal or length(trim(coalesce(note, ''))) >= 3)
);
create index guest_payments_booking_idx on public.guest_payments (booking_id, entry_no);
create index guest_payments_paid_on_idx on public.guest_payments (paid_on);
create index guest_payments_credit_note_idx on public.guest_payments (credit_note_id) where credit_note_id is not null;

create function public.guest_payments_before_insert() returns trigger
language plpgsql set search_path = '' as $$
declare fx record;
begin
  new.created_by := coalesce(new.created_by, auth.uid());
  if new.created_by_email is null or new.created_by_email = 'system' then
    new.created_by_email := coalesce(nullif(lower(coalesce(auth.jwt() ->> 'email', '')), ''), 'system');
  end if;
  select * into fx from public.finance_fx_lookup(new.currency, new.paid_on);
  new.fx_rate_to_usd := fx.usd_per_unit;
  new.fx_rate_date := fx.rate_date;
  new.fx_locked := coalesce(fx.locked, false);
  new.amount_usd := public.finance_to_usd(new.amount, new.fx_rate_to_usd);
  return new;
end $$;

-- Append-only, except that a provisional USD conversion may be refreshed.
create function public.guest_payments_before_update() returns trigger
language plpgsql set search_path = '' as $$
declare fx record;
begin
  if tg_op <> 'UPDATE' then raise exception 'guest_payments is append-only; post a reversal instead.' using errcode = '55000'; end if;
  if old.fx_locked or (to_jsonb(new) - array['fx_rate_to_usd', 'fx_rate_date', 'fx_locked', 'amount_usd'])
       <> (to_jsonb(old) - array['fx_rate_to_usd', 'fx_rate_date', 'fx_locked', 'amount_usd']) then
    raise exception 'guest_payments is append-only; post a reversal instead.' using errcode = '55000';
  end if;
  select * into fx from public.finance_fx_lookup(new.currency, new.paid_on);
  new.fx_rate_to_usd := fx.usd_per_unit;
  new.fx_rate_date := fx.rate_date;
  new.fx_locked := coalesce(fx.locked, false);
  new.amount_usd := public.finance_to_usd(new.amount, new.fx_rate_to_usd);
  return new;
end $$;

create trigger guest_payments_before_insert before insert on public.guest_payments
  for each row execute function public.guest_payments_before_insert();
create trigger guest_payments_before_update before update or delete on public.guest_payments
  for each row execute function public.guest_payments_before_update();
create trigger guest_payments_no_truncate before truncate on public.guest_payments
  for each statement execute function public.finance_block_delete();
create trigger guest_payments_audit after insert on public.guest_payments
  for each row execute function public.finance_audit_trigger('id');

-- ---------------------------------------------------------------------------
-- Summaries.
-- ---------------------------------------------------------------------------
create view public.booking_payment_summary with (security_invoker = true) as
with sums as (
  select p.booking_id,
    coalesce(sum(p.applied_amount) filter (where p.kind in ('deposit', 'balance', 'credit_redemption')), 0) as received,
    coalesce(-sum(p.applied_amount) filter (where p.kind = 'refund'), 0) as refunded_cash,
    coalesce(-sum(p.applied_amount) filter (where p.kind = 'credit_note_issued'), 0) as refunded_credit,
    count(*) as entries,
    max(p.paid_on) as last_paid_on
  from public.guest_payments p
  group by p.booking_id
)
select b.id as booking_id, b.reference, upper(b.currency) as currency, b.amount as total, b.status::text as booking_status,
  coalesce(s.received, 0) as received,
  coalesce(s.refunded_cash, 0) as refunded_cash,
  coalesce(s.refunded_credit, 0) as refunded_credit,
  coalesce(s.refunded_cash, 0) + coalesce(s.refunded_credit, 0) as refunded,
  coalesce(s.received, 0) - coalesce(s.refunded_cash, 0) - coalesce(s.refunded_credit, 0) as net_paid,
  case when b.status = 'cancelled' then 0 else greatest(b.amount - coalesce(s.received, 0), 0) end as outstanding,
  coalesce(s.entries, 0) as entries,
  s.last_paid_on,
  case
    when coalesce(s.entries, 0) = 0 then b.payment_status::text
    when coalesce(s.received, 0) = 0 and coalesce(s.refunded_cash, 0) + coalesce(s.refunded_credit, 0) = 0 then 'unpaid'
    when coalesce(s.refunded_cash, 0) + coalesce(s.refunded_credit, 0) > 0
      and coalesce(s.received, 0) - coalesce(s.refunded_cash, 0) - coalesce(s.refunded_credit, 0) <= 0 then 'refunded'
    when coalesce(s.refunded_cash, 0) + coalesce(s.refunded_credit, 0) > 0 then 'partly_refunded'
    when coalesce(s.received, 0) >= b.amount then 'paid'
    else 'deposit_paid' end as payment_state
from public.bookings b
left join sums s on s.booking_id = b.id;

create view public.credit_note_balances with (security_invoker = true) as
select c.*,
  coalesce(r.redeemed, 0) as redeemed,
  c.amount - coalesce(r.redeemed, 0) as remaining,
  case
    when c.voided_at is not null then 'void'
    when c.amount - coalesce(r.redeemed, 0) <= 0 then 'used'
    when c.expires_on is not null and c.expires_on < current_date then 'expired'
    when coalesce(r.redeemed, 0) > 0 then 'partly_used'
    else 'open' end as status
from public.credit_notes c
left join (
  select credit_note_id, sum(amount) as redeemed from public.guest_payments
  where kind = 'credit_redemption' group by credit_note_id
) r on r.credit_note_id = c.id;

-- ---------------------------------------------------------------------------
-- Financial lines: recorded payments drive refunds and retained revenue.
-- ---------------------------------------------------------------------------
alter table public.booking_financial_lines
  add column payments_recorded boolean not null default false,
  add column payments_received numeric(14,2) not null default 0,
  add column payments_refunded numeric(14,2) not null default 0 check (payments_refunded >= 0);

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

-- Spreads a booking's recorded payments and refunds over its trips by net
-- price (the last trip takes the rounding remainder).
create function public.finance_apply_guest_payments(p_booking_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_recorded boolean;
  v_received numeric;
  v_refunded numeric;
  total_net numeric;
  line record;
  n integer;
  i integer := 0;
  received_left numeric;
  refunded_left numeric;
  line_received numeric;
  line_refunded numeric;
begin
  select count(*) > 0,
    coalesce(sum(applied_amount) filter (where kind in ('deposit', 'balance', 'credit_redemption')), 0),
    coalesce(-sum(applied_amount) filter (where kind in ('refund', 'credit_note_issued')), 0)
  into v_recorded, v_received, v_refunded
  from public.guest_payments where booking_id = p_booking_id;
  if not v_recorded then return; end if;
  v_refunded := greatest(v_refunded, 0);

  select count(*), coalesce(sum(net_selling_price), 0) into n, total_net
  from public.booking_financial_lines where booking_id = p_booking_id and outcome <> 'removed';
  received_left := v_received;
  refunded_left := v_refunded;
  for line in
    select id, net_selling_price from public.booking_financial_lines
    where booking_id = p_booking_id and outcome <> 'removed' order by line_no
  loop
    i := i + 1;
    if i = n then
      line_received := received_left;
      line_refunded := refunded_left;
    elsif total_net > 0 then
      line_received := round(v_received * line.net_selling_price / total_net, 2);
      line_refunded := round(v_refunded * line.net_selling_price / total_net, 2);
    else
      line_received := 0;
      line_refunded := 0;
    end if;
    received_left := received_left - line_received;
    refunded_left := refunded_left - line_refunded;
    line_refunded := least(greatest(line_refunded, 0), line.net_selling_price);
    update public.booking_financial_lines set payments_recorded = true, payments_received = line_received, payments_refunded = line_refunded
    where id = line.id and (payments_recorded, payments_received, payments_refunded) is distinct from (true, line_received, line_refunded);
  end loop;
end $$;

create or replace function public.finance_sync_booking_safe(p_booking_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_booking_id is null then return; end if;
  begin
    perform public.finance_sync_booking(p_booking_id);
    perform public.finance_apply_guest_payments(p_booking_id);
  exception when others then
    insert into public.finance_sync_errors (booking_id, context, message) values (p_booking_id, 'booking_sync', sqlerrm);
  end;
end $$;

-- After each guest payment: keep bookings.payment_status (used by emails,
-- filters and referral rules) in step with the recorded money, then
-- re-spread payments over the booking's trips.
create function public.guest_payments_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare s public.booking_payment_summary; v_status public.payment_status;
begin
  select * into s from public.booking_payment_summary where booking_id = new.booking_id;
  v_status := case
    when s.refunded > 0 and s.net_paid <= 0 then 'refunded'
    when s.received > 0 and s.received >= s.total then 'paid'
    else 'unpaid' end;
  update public.bookings set payment_status = v_status where id = new.booking_id and payment_status is distinct from v_status;
  perform public.finance_sync_booking_safe(new.booking_id);
  return null;
end $$;
create trigger guest_payments_after_insert after insert on public.guest_payments
  for each row execute function public.guest_payments_after_insert();

create or replace function public.finance_refresh_unlocked_fx() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare lines_updated integer; expenses_updated integer; payments_updated integer;
begin
  update public.booking_financial_lines set updated_at = now() where not fx_locked or not supplier_fx_locked;
  get diagnostics lines_updated = row_count;
  update public.expenses set updated_at = now() where not fx_locked and voided_at is null;
  get diagnostics expenses_updated = row_count;
  update public.guest_payments set fx_locked = fx_locked where not fx_locked;
  get diagnostics payments_updated = row_count;
  return jsonb_build_object('lines', lines_updated, 'expenses', expenses_updated, 'guest_payments', payments_updated);
end $$;

-- ---------------------------------------------------------------------------
-- Write RPCs (owner + accountant: manage_finance).
-- ---------------------------------------------------------------------------
-- Converts an amount paid in p_currency into the booking currency at the
-- payment-date rates, unless the rate actually used is given as p_applied.
create function public.finance_guest_applied_amount(p_amount numeric, p_currency public.finance_currency,
  p_booking_currency public.finance_currency, p_paid_on date, p_applied numeric)
returns numeric language plpgsql stable set search_path = '' as $$
declare paid record; booked record;
begin
  if p_currency = p_booking_currency then
    if p_applied is not null and p_applied <> p_amount then
      raise exception 'The amount applied must equal the amount paid when both are in %.', p_currency using errcode = '22023';
    end if;
    return p_amount;
  end if;
  if p_applied is not null then
    if p_applied <= 0 then raise exception 'Enter a positive amount in %.', p_booking_currency using errcode = '22023'; end if;
    return p_applied;
  end if;
  select * into paid from public.finance_fx_lookup(p_currency, p_paid_on);
  select * into booked from public.finance_fx_lookup(p_booking_currency, p_paid_on);
  if paid.usd_per_unit is null or booked.usd_per_unit is null then
    raise exception 'No % / % exchange rate is known for %. Enter the amount in % that this payment covers.',
      p_currency, p_booking_currency, p_paid_on, p_booking_currency using errcode = '22023';
  end if;
  return round(p_amount * paid.usd_per_unit / booked.usd_per_unit, 2);
end $$;

-- Returns the stored entry when an idempotency key is repeated for the same
-- request (e.g. a double tap on a phone), and fails if it was used for another.
create function public.finance_guest_replay(p_key uuid, p_booking_id uuid, p_kind public.finance_guest_entry_kind)
returns public.guest_payments language plpgsql stable set search_path = '' as $$
declare existing public.guest_payments;
begin
  if p_key is null then raise exception 'An idempotency key is required.' using errcode = '22023'; end if;
  select * into existing from public.guest_payments where idempotency_key = p_key;
  if found and (existing.booking_id <> p_booking_id or existing.kind <> p_kind) then
    raise exception 'This request key was already used for a different payment.' using errcode = '22023';
  end if;
  return existing;
end $$;

create function public.finance_record_guest_payment(
  p_idempotency_key uuid, p_booking_id uuid, p_kind text, p_amount numeric, p_currency text, p_method text,
  p_paid_on date, p_applied_amount numeric default null, p_reference text default null, p_note text default null)
returns public.guest_payments
language plpgsql security definer set search_path = '' as $$
declare
  v_kind public.finance_guest_entry_kind := p_kind::public.finance_guest_entry_kind;
  v_method public.finance_payment_method := p_method::public.finance_payment_method;
  v_currency public.finance_currency := p_currency::public.finance_currency;
  v_booking_currency public.finance_currency;
  v_applied numeric;
  s public.booking_payment_summary;
  saved public.guest_payments;
begin
  perform public.finance_require('manage_finance');
  if v_kind not in ('deposit', 'balance', 'refund') then
    raise exception 'Use the credit note actions for credit notes.' using errcode = '22023';
  end if;
  if v_method = 'credit_note' then raise exception 'Use the credit note actions for credit notes.' using errcode = '22023'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Enter a positive amount.' using errcode = '22023'; end if;
  if p_paid_on is null then raise exception 'A payment date is required.' using errcode = '22023'; end if;
  if p_paid_on > current_date + 1 then raise exception 'The payment date cannot be in the future.' using errcode = '22023'; end if;
  saved := public.finance_guest_replay(p_idempotency_key, p_booking_id, v_kind);
  if saved.id is not null then return saved; end if;

  -- Lock the booking so concurrent refunds cannot exceed what was received.
  select upper(currency)::public.finance_currency into v_booking_currency from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking not found.' using errcode = 'P0002'; end if;
  v_applied := public.finance_guest_applied_amount(p_amount, v_currency, v_booking_currency, p_paid_on, p_applied_amount);
  if v_kind = 'refund' then
    select * into s from public.booking_payment_summary where booking_id = p_booking_id;
    if v_applied > s.net_paid then
      raise exception 'Refunds (% %) cannot exceed what the guest has paid and not yet had back (% %). Record the original payment first.',
        v_applied, v_booking_currency, s.net_paid, v_booking_currency using errcode = '23514';
    end if;
  end if;

  insert into public.guest_payments (idempotency_key, booking_id, kind, method, amount, currency, booking_currency,
    applied_amount, applied_rate, paid_on, reference, note)
  values (p_idempotency_key, p_booking_id, v_kind, v_method,
    case when v_kind = 'refund' then -p_amount else p_amount end, v_currency, v_booking_currency,
    case when v_kind = 'refund' then -v_applied else v_applied end, round(v_applied / p_amount, 10), p_paid_on,
    nullif(trim(coalesce(p_reference, '')), ''), nullif(trim(coalesce(p_note, '')), ''))
  returning * into saved;
  return saved;
end $$;

create function public.finance_issue_credit_note(
  p_idempotency_key uuid, p_booking_id uuid, p_amount numeric, p_issued_on date, p_reason text, p_expires_on date default null)
returns public.credit_note_balances
language plpgsql security definer set search_path = '' as $$
declare
  b public.bookings;
  s public.booking_payment_summary;
  saved public.guest_payments;
  note public.credit_notes;
  result public.credit_note_balances;
begin
  perform public.finance_require('manage_finance');
  if p_amount is null or p_amount <= 0 then raise exception 'Enter a positive amount.' using errcode = '22023'; end if;
  if p_issued_on is null then raise exception 'An issue date is required.' using errcode = '22023'; end if;
  if length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'Enter a reason for the credit note.' using errcode = '22023'; end if;
  saved := public.finance_guest_replay(p_idempotency_key, p_booking_id, 'credit_note_issued');
  if saved.id is not null then
    select * into result from public.credit_note_balances where id = saved.credit_note_id;
    return result;
  end if;

  select * into b from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking not found.' using errcode = 'P0002'; end if;
  select * into s from public.booking_payment_summary where booking_id = p_booking_id;
  if p_amount > s.net_paid then
    raise exception 'A credit note (% %) cannot exceed what the guest has paid and not yet had back (% %).',
      p_amount, s.currency, s.net_paid, s.currency using errcode = '23514';
  end if;

  insert into public.credit_notes (number, booking_id, customer_name, customer_email, customer_phone, currency, amount,
    issued_on, expires_on, reason, created_by, created_by_email)
  values (format('CN-%s-%s', to_char(p_issued_on, 'YYYY'), lpad(nextval('public.credit_note_number_seq')::text, 4, '0')),
    b.id, b.customer_name, lower(b.customer_email), b.phone, upper(b.currency)::public.finance_currency, p_amount,
    p_issued_on, p_expires_on, trim(p_reason), auth.uid(),
    coalesce(nullif(lower(coalesce(auth.jwt() ->> 'email', '')), ''), 'system'))
  returning * into note;

  insert into public.guest_payments (idempotency_key, booking_id, kind, method, amount, currency, booking_currency,
    applied_amount, applied_rate, paid_on, credit_note_id, reference, note)
  values (p_idempotency_key, b.id, 'credit_note_issued', 'credit_note', -p_amount, note.currency, note.currency,
    -p_amount, 1, p_issued_on, note.id, note.number, trim(p_reason));

  select * into result from public.credit_note_balances where id = note.id;
  return result;
end $$;

create function public.finance_redeem_credit_note(
  p_idempotency_key uuid, p_credit_note_id uuid, p_booking_id uuid, p_amount numeric, p_paid_on date, p_applied_amount numeric default null)
returns public.guest_payments
language plpgsql security definer set search_path = '' as $$
declare
  c public.credit_note_balances;
  v_booking_currency public.finance_currency;
  v_applied numeric;
  saved public.guest_payments;
begin
  perform public.finance_require('manage_finance');
  if p_amount is null or p_amount <= 0 then raise exception 'Enter a positive amount.' using errcode = '22023'; end if;
  if p_paid_on is null then raise exception 'A date is required.' using errcode = '22023'; end if;
  saved := public.finance_guest_replay(p_idempotency_key, p_booking_id, 'credit_redemption');
  if saved.id is not null then return saved; end if;

  perform 1 from public.credit_notes where id = p_credit_note_id for update;
  select * into c from public.credit_note_balances where id = p_credit_note_id;
  if not found then raise exception 'Credit note not found.' using errcode = 'P0002'; end if;
  if c.status = 'void' then raise exception 'Credit note % is void.', c.number using errcode = '23514'; end if;
  if c.expires_on is not null and c.expires_on < p_paid_on then raise exception 'Credit note % expired on %.', c.number, c.expires_on using errcode = '23514'; end if;
  if p_amount > c.remaining then
    raise exception 'Credit note % has only % % left.', c.number, c.remaining, c.currency using errcode = '23514';
  end if;
  select upper(currency)::public.finance_currency into v_booking_currency from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking not found.' using errcode = 'P0002'; end if;
  v_applied := public.finance_guest_applied_amount(p_amount, c.currency, v_booking_currency, p_paid_on, p_applied_amount);

  insert into public.guest_payments (idempotency_key, booking_id, kind, method, amount, currency, booking_currency,
    applied_amount, applied_rate, paid_on, credit_note_id, reference)
  values (p_idempotency_key, p_booking_id, 'credit_redemption', 'credit_note', p_amount, c.currency, v_booking_currency,
    v_applied, round(v_applied / p_amount, 10), p_paid_on, c.id, c.number)
  returning * into saved;
  return saved;
end $$;

-- Reverses one entry. Reversing a credit note's issue voids the credit note
-- (only while nothing has been redeemed from it).
create function public.finance_reverse_guest_payment(p_entry_id uuid, p_note text)
returns public.guest_payments
language plpgsql security definer set search_path = '' as $$
declare
  original public.guest_payments;
  c public.credit_note_balances;
  s public.booking_payment_summary;
  saved public.guest_payments;
begin
  perform public.finance_require('manage_finance');
  if length(trim(coalesce(p_note, ''))) < 3 then raise exception 'Enter a reason for the reversal.' using errcode = '22023'; end if;
  select * into original from public.guest_payments where id = p_entry_id;
  if not found then raise exception 'Payment entry not found.' using errcode = 'P0002'; end if;
  perform 1 from public.bookings where id = original.booking_id for update;
  if original.is_reversal then raise exception 'A reversal cannot itself be reversed.' using errcode = '23514'; end if;
  if exists (select 1 from public.guest_payments where reverses_entry_id = original.id) then
    raise exception 'This entry has already been reversed.' using errcode = '23514';
  end if;
  if original.kind = 'credit_note_issued' then
    perform 1 from public.credit_notes where id = original.credit_note_id for update;
    select * into c from public.credit_note_balances where id = original.credit_note_id;
    if c.redeemed > 0 then
      raise exception 'Credit note % has already been used; reverse its redemptions first.', c.number using errcode = '23514';
    end if;
    update public.credit_notes set voided_at = now(), voided_by = auth.uid(), void_reason = trim(p_note) where id = c.id;
  end if;
  if original.kind in ('deposit', 'balance', 'credit_redemption') then
    -- Taking money back out must not leave more refunded than received.
    select * into s from public.booking_payment_summary where booking_id = original.booking_id;
    if s.net_paid - original.applied_amount < 0 then
      raise exception 'Reverse the refunds on this booking before reversing this payment.' using errcode = '23514';
    end if;
  end if;

  insert into public.guest_payments (booking_id, kind, method, amount, currency, booking_currency, applied_amount, applied_rate,
    paid_on, credit_note_id, is_reversal, reverses_entry_id, reference, note)
  values (original.booking_id, original.kind, original.method, -original.amount, original.currency, original.booking_currency,
    -original.applied_amount, original.applied_rate, current_date, original.credit_note_id, true, original.id,
    original.reference, trim(p_note))
  returning * into saved;
  return saved;
end $$;

-- ---------------------------------------------------------------------------
-- Cancellation impact per month (by trip date, like the P&L) and reason.
-- lost_sales_usd: net price of cancelled trips that was not kept.
-- net_cost_usd:   partner cancellation fees + payment fees - revenue kept.
-- ---------------------------------------------------------------------------
create view public.finance_cancellation_impact with (security_invoker = true) as
select date_trunc('month', l.trip_date)::date as month,
  coalesce(b.cancellation_reason::text, 'unspecified') as reason,
  count(distinct l.booking_id) as bookings,
  sum(public.finance_to_usd(l.net_selling_price, l.fx_rate_to_usd)) - sum(l.net_sales_usd) as lost_sales_usd,
  sum(l.net_sales_usd) as retained_usd,
  sum(l.refund_usd) as refunds_usd,
  sum(l.supplier_cost_usd) as partner_fees_usd,
  sum(l.payment_fees_usd) as payment_fees_usd,
  sum(l.supplier_cost_usd) + sum(l.payment_fees_usd) - sum(l.net_sales_usd) as net_cost_usd,
  count(*) filter (where l.fx_missing) as lines_missing_fx
from public.booking_financial_lines l
join public.bookings b on b.id = l.booking_id
where l.outcome = 'cancelled' and l.excluded_reason is null and l.trip_date is not null
group by 1, 2;

-- ---------------------------------------------------------------------------
-- Access.
-- ---------------------------------------------------------------------------
alter table public.guest_payments enable row level security;
alter table public.credit_notes enable row level security;
create policy "Finance staff read guest payments" on public.guest_payments for select to authenticated using (public.admin_has_permission('view_finance'));
create policy "Finance staff read credit notes" on public.credit_notes for select to authenticated using (public.admin_has_permission('view_finance'));

revoke all on public.guest_payments, public.credit_notes from anon, authenticated;
grant select on public.guest_payments, public.credit_notes to authenticated;
grant all on public.guest_payments, public.credit_notes to service_role;
revoke all on public.booking_payment_summary, public.credit_note_balances, public.finance_cancellation_impact from anon, authenticated;
grant select on public.booking_payment_summary, public.credit_note_balances, public.finance_cancellation_impact to authenticated, service_role;
revoke all on sequence public.credit_note_number_seq from anon, authenticated;

do $$
declare fn text;
begin
  foreach fn in array array[
    'public.guest_payments_before_insert()', 'public.guest_payments_before_update()', 'public.guest_payments_after_insert()',
    'public.finance_apply_guest_payments(uuid)',
    'public.finance_guest_applied_amount(numeric, public.finance_currency, public.finance_currency, date, numeric)',
    'public.finance_guest_replay(uuid, uuid, public.finance_guest_entry_kind)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;
  foreach fn in array array[
    'public.finance_record_guest_payment(uuid, uuid, text, numeric, text, text, date, numeric, text, text)',
    'public.finance_issue_credit_note(uuid, uuid, numeric, date, text, date)',
    'public.finance_redeem_credit_note(uuid, uuid, uuid, numeric, date, numeric)',
    'public.finance_reverse_guest_payment(uuid, text)'
  ] loop
    execute format('revoke all on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end $$;
