-- Finance: append-only supplier ledger, automatic booking -> financials ->
-- ledger syncing, the finance write RPCs, and status/balance views.
--
-- SIGN CONVENTION: a positive balance means the supplier owes Daily Red Sea;
-- a negative balance means Daily Red Sea owes the supplier.
--
-- AUTOMATIC LEDGER RULES (one active automatic entry per financial line):
--   * collected_by = daily_red_sea -> supplier_cost_payable = -recognised supplier
--     cost, in the supplier cost currency (DRS owes the supplier).
--   * collected_by = supplier -> commission_receivable = recognised net sales -
--     recognised supplier cost, in the booking currency (supplier owes DRS what
--     it collected above its own cost; agent commission is paid by DRS itself).
--   * No entry while the line is pending/removed/excluded, has no supplier, or
--     the amount is zero. Whenever the wanted entry changes, the previous
--     automatic entry is reversed and a new one is posted; nothing is edited.
--
-- FX ON AUTOMATIC ENTRIES (append-only correction):
--   * An automatic entry's amount_usd is exactly the line's own USD figure
--     (-supplier_cost_usd, or net_sales_usd - supplier_cost_usd), and is only
--     set once the rate(s) it depends on are locked (exact trip-date rate).
--     While a rate is provisional or missing, the entry is posted in its own
--     currency with amount_usd / fx_rate_to_usd NULL ("USD pending").
--   * The rate and USD value are part of the entry's identity: when the line's
--     rate locks (or an admin override changes a provisional rate), the entry
--     is reversed and reposted, so ledger USD always equals the line's USD.
--   * If the obligation itself cannot be computed in its own currency (a
--     supplier-collected line whose supplier cost is in another currency, and
--     either rate is not locked yet), no automatic entry exists and the line's
--     ledger_state is 'awaiting_fx'; any earlier automatic entry is reversed.
--
-- BALANCES are always scoped by (supplier, line, currency): see
-- supplier_line_balances. A line reassigned to another supplier keeps the old
-- supplier's history (and any open balance) with that supplier.
--
-- Manual entries (payments, commission received, net settlements, adjustments)
-- are posted through the finance_* RPCs below and corrected only by reversal.
-- Every RPC that reads a line's balance first locks the line row, and net
-- settlements are idempotent by a client-supplied key.

create type public.finance_ledger_entry_type as enum (
  'supplier_cost_payable', 'commission_receivable', 'payment_to_supplier',
  'commission_received_from_supplier', 'net_settlement', 'adjustment', 'reversal');

create table public.supplier_ledger (
  id uuid primary key default gen_random_uuid(),
  entry_no bigint generated always as identity unique,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  booking_id uuid references public.bookings(id) on delete restrict,
  line_id uuid references public.booking_financial_lines(id) on delete restrict,
  entry_type public.finance_ledger_entry_type not null,
  amount numeric(14,2) not null check (amount <> 0),
  currency public.finance_currency not null,
  fx_rate_to_usd numeric(20,12),
  fx_rate_date date,
  amount_usd numeric(14,2),
  entry_date date not null,
  reverses_entry_id uuid unique references public.supplier_ledger(id) on delete restrict,
  settlement_id uuid,
  is_automatic boolean not null default false,
  note text check (note is null or length(note) <= 1000),
  created_by uuid,
  created_by_email text not null default 'system',
  created_at timestamptz not null default now(),
  check (entry_type <> 'supplier_cost_payable' or amount < 0),
  check (entry_type <> 'payment_to_supplier' or amount > 0),
  check (entry_type <> 'commission_received_from_supplier' or amount < 0),
  check ((entry_type = 'reversal') = (reverses_entry_id is not null)),
  check (entry_type not in ('adjustment', 'reversal') or length(trim(coalesce(note, ''))) >= 3),
  check (line_id is null or booking_id is not null)
);

create index supplier_ledger_supplier_idx on public.supplier_ledger (supplier_id, entry_date, entry_no);
create index supplier_ledger_line_idx on public.supplier_ledger (line_id);
create index supplier_ledger_booking_idx on public.supplier_ledger (booking_id);
create index supplier_ledger_settlement_idx on public.supplier_ledger (settlement_id) where settlement_id is not null;

create function public.supplier_ledger_append_only() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'supplier_ledger is append-only; post a reversal entry instead.' using errcode = '55000';
end $$;

create trigger supplier_ledger_no_update before update or delete on public.supplier_ledger
  for each row execute function public.supplier_ledger_append_only();
create trigger supplier_ledger_no_truncate before truncate on public.supplier_ledger
  for each statement execute function public.supplier_ledger_append_only();

-- Reversals copy their amounts from the original; everything else is converted
-- to USD at the entry date unless a rate is supplied (automatic entries use the
-- trip-date rate of their line).
create function public.supplier_ledger_before_insert() returns trigger
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

create trigger supplier_ledger_before_insert before insert on public.supplier_ledger
  for each row execute function public.supplier_ledger_before_insert();
create trigger supplier_ledger_audit after insert on public.supplier_ledger
  for each row execute function public.finance_audit_trigger('id');

-- ---------------------------------------------------------------------------
-- Automatic ledger sync for one financial line.
-- ---------------------------------------------------------------------------
create function public.finance_line_ledger_currency(l public.booking_financial_lines)
returns public.finance_currency language sql immutable set search_path = '' as $$
  select case when l.collected_by = 'daily_red_sea' then l.supplier_cost_currency else l.currency end;
$$;

create function public.finance_sync_line_ledger(p_line_id uuid) returns void
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
    where e.line_id = l.id and e.is_automatic and e.entry_type in ('supplier_cost_payable', 'commission_receivable')
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

create function public.finance_line_after_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.finance_sync_line_ledger(new.id);
  return null;
end $$;

create trigger booking_financial_lines_after_write after insert or update on public.booking_financial_lines
  for each row execute function public.finance_line_after_write();

-- ---------------------------------------------------------------------------
-- Booking -> header + lines.
-- ---------------------------------------------------------------------------
create function public.finance_sync_booking(p_booking_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  b public.bookings;
  v_currency public.finance_currency;
  trips jsonb;
  trip jsonb;
  n integer;
  i integer;
  total_weight numeric;
  weight numeric;
  net_total numeric;
  discount_total numeric;
  net_allocated numeric := 0;
  discount_allocated numeric := 0;
  line_net numeric;
  line_discount numeric;
  base_outcome public.finance_line_outcome;
  v_outcome public.finance_line_outcome;
  has_transactions boolean;
  v_excluded text;
  assignment record;
  supplier_count integer;
  existing public.booking_financial_lines;
  found_existing boolean;
  price record;
  v_supplier uuid;
  v_source public.finance_cost_source;
  v_cost numeric;
  v_cost_currency public.finance_currency;
  v_percent numeric;
  v_agent numeric;
  v_adults integer;
  v_youth integer;
  v_guests integer;
  v_slug text;
  v_trip_date date;
  dims public.finance_tour_dimensions;
begin
  select * into b from public.bookings where id = p_booking_id;
  if not found then return; end if;
  if upper(coalesce(b.currency, '')) not in ('USD', 'EUR', 'GBP', 'EGP', 'SAR') then
    raise exception 'Booking % uses unsupported currency %.', b.reference, b.currency;
  end if;
  v_currency := upper(b.currency)::public.finance_currency;

  insert into public.booking_financials (booking_id, reference, booking_currency, booking_status, payment_status, archived, agent_commission_percent)
  values (b.id, b.reference, v_currency, b.status::text, b.payment_status::text, b.archived_at is not null, b.sales_commission_percent)
  on conflict (booking_id) do update set
    reference = excluded.reference, booking_currency = excluded.booking_currency, booking_status = excluded.booking_status,
    payment_status = excluded.payment_status, archived = excluded.archived,
    agent_commission_percent = excluded.agent_commission_percent, updated_at = now()
  where (public.booking_financials.reference, public.booking_financials.booking_currency, public.booking_financials.booking_status,
         public.booking_financials.payment_status, public.booking_financials.archived, public.booking_financials.agent_commission_percent)
    is distinct from (excluded.reference, excluded.booking_currency, excluded.booking_status, excluded.payment_status,
         excluded.archived, excluded.agent_commission_percent);

  -- One trip per line. Multi-trip bookings use the pricing snapshot, else the
  -- capacity reservations; everything else is a single trip.
  if b.tour_slug = 'multi-trip' then
    if jsonb_typeof(b.pricing_snapshot -> 'trips') = 'array' and jsonb_array_length(b.pricing_snapshot -> 'trips') > 0 then
      select jsonb_agg(jsonb_build_object(
          'tour_slug', (select d.tour_slug from public.finance_tour_dimensions d where d.tour_name = t ->> 'name' order by d.tour_slug limit 1),
          'tour_name', t ->> 'name',
          'trip_date', coalesce(nullif(t ->> 'date', ''), b.date::text),
          'guests', coalesce((t ->> 'guests')::integer, 0),
          'adults', coalesce((t -> 'participants' ->> 'adults')::integer, 0),
          'youth', coalesce((t -> 'participants' ->> 'youth')::integer, 0),
          'weight', (select coalesce(sum((line ->> 'total')::numeric), 0) from jsonb_array_elements(t -> 'lines') line))
        order by ord)
      into trips from jsonb_array_elements(b.pricing_snapshot -> 'trips') with ordinality as x(t, ord);
    else
      select jsonb_agg(jsonb_build_object(
          'tour_slug', a.tour_slug, 'tour_name', coalesce(d.tour_name, a.tour_slug), 'trip_date', a.service_date::text,
          'guests', r.places, 'adults', 0, 'youth', 0, 'weight', r.places)
        order by a.service_date, a.start_time nulls first, a.tour_slug)
      into trips
      from public.booking_capacity_reservations r
      join public.tour_availability a on a.id = r.availability_id
      left join public.finance_tour_dimensions d on d.tour_slug = a.tour_slug
      where r.booking_id = b.id;
    end if;
  end if;
  if trips is null or jsonb_array_length(trips) = 0 then
    trips := jsonb_build_array(jsonb_build_object(
      'tour_slug', nullif(b.tour_slug, 'multi-trip'), 'tour_name', coalesce(b.tour_name, case when b.type = 'transfer' then 'Transfer' end),
      'trip_date', b.date::text, 'guests', coalesce(b.guests, 0), 'adults', coalesce(b.adults, 0), 'youth', coalesce(b.youth, 0), 'weight', 1));
  end if;

  n := jsonb_array_length(trips);
  select coalesce(sum((value ->> 'weight')::numeric), 0) into total_weight from jsonb_array_elements(trips);
  net_total := coalesce(b.amount, 0);
  discount_total := case when b.subtotal is not null and b.subtotal >= b.amount then b.subtotal - b.amount else coalesce(b.discount_amount, 0) end;

  base_outcome := case b.status::text when 'new' then 'pending' when 'confirmed' then 'active' when 'completed' then 'completed' else 'cancelled' end;
  has_transactions := exists (select 1 from public.supplier_ledger e where e.booking_id = b.id and not e.is_automatic)
    or exists (select 1 from public.booking_financial_lines x where x.booking_id = b.id and x.collection_status <> 'not_collected');
  v_excluded := case when b.archived_at is not null and not has_transactions then 'archived' end;

  select count(distinct supplier_id) into supplier_count from public.booking_assignments
    where booking_id = b.id and assignment_type = 'supplier' and status <> 'cancelled' and supplier_id is not null;
  select supplier_id, internal_cost, upper(currency) as currency into assignment from public.booking_assignments
    where booking_id = b.id and assignment_type = 'supplier' and status <> 'cancelled' and supplier_id is not null
    order by created_at, id limit 1;

  for i in 0 .. n - 1 loop
    trip := trips -> i;
    weight := case when total_weight > 0 then (trip ->> 'weight')::numeric else 1 end;
    if i = n - 1 then
      line_net := net_total - net_allocated;
      line_discount := discount_total - discount_allocated;
    else
      line_net := round(net_total * weight / case when total_weight > 0 then total_weight else n end, 2);
      line_discount := round(discount_total * weight / case when total_weight > 0 then total_weight else n end, 2);
    end if;
    net_allocated := net_allocated + line_net;
    discount_allocated := discount_allocated + line_discount;

    v_slug := trip ->> 'tour_slug';
    v_trip_date := nullif(trip ->> 'trip_date', '')::date;
    v_guests := coalesce((trip ->> 'guests')::integer, 0);
    v_adults := coalesce((trip ->> 'adults')::integer, 0);
    v_youth := coalesce((trip ->> 'youth')::integer, 0);
    if v_adults + v_youth = 0 then v_adults := v_guests; end if;
    select * into dims from public.finance_tour_dimensions where tour_slug = v_slug;

    select * into existing from public.booking_financial_lines where booking_id = b.id and line_no = i + 1;
    found_existing := found;

    v_outcome := case when found_existing and existing.no_show and base_outcome in ('active', 'completed') then 'no_show' else base_outcome end;

    -- Supplier: a manual choice wins, else the booking's supplier assignment.
    v_supplier := case
      when found_existing and existing.supplier_manual then existing.supplier_id
      when n = 1 or supplier_count = 1 then assignment.supplier_id
      else null end;

    -- Supplier cost: manual > assignment internal cost > supplier price (per
    -- person/fixed or percentage) > none. Automatic costs freeze once the trip
    -- is completed/cancelled/no-show, unless no cost was ever found.
    if found_existing and (existing.supplier_cost_source in ('manual_amount', 'manual_percent')
       or (existing.outcome not in ('pending', 'active') and existing.supplier_cost_source <> 'none'
           and v_supplier is not distinct from existing.supplier_id)) then
      v_source := existing.supplier_cost_source; v_cost := existing.supplier_cost;
      v_cost_currency := existing.supplier_cost_currency; v_percent := existing.supplier_cost_percent;
    else
      v_source := 'none'; v_cost := 0; v_cost_currency := v_currency; v_percent := null;
      if n = 1 and assignment.internal_cost is not null and assignment.supplier_id is not distinct from v_supplier
         and assignment.currency in ('USD', 'EUR', 'GBP', 'EGP', 'SAR') then
        v_source := 'assignment'; v_cost := assignment.internal_cost; v_cost_currency := assignment.currency::public.finance_currency;
      elsif v_supplier is not null and v_slug is not null then
        select sp.* into price from public.supplier_prices sp
          where sp.supplier_id = v_supplier and sp.tour_slug = v_slug
            and (sp.valid_from is null or v_trip_date is null or sp.valid_from <= v_trip_date)
            and (sp.valid_to is null or v_trip_date is null or sp.valid_to >= v_trip_date)
          order by sp.valid_from desc nulls last limit 1;
        if found and upper(price.currency) in ('USD', 'EUR', 'GBP', 'EGP', 'SAR') then
          if price.cost_percent is not null then
            v_source := 'supplier_percent'; v_percent := price.cost_percent;
          else
            v_source := 'supplier_price';
            v_cost := price.adult_cost * v_adults + coalesce(price.youth_cost, price.adult_cost) * v_youth + coalesce(price.fixed_cost, 0);
            v_cost_currency := upper(price.currency)::public.finance_currency;
          end if;
        end if;
      end if;
    end if;

    v_agent := case when found_existing and existing.agent_commission_manual then existing.agent_commission
      else round(line_net * coalesce(b.sales_commission_percent, 0) / 100, 2) end;

    if not found_existing then
      insert into public.booking_financial_lines (booking_id, line_no, trip_date, tour_slug, tour_name, destination, product_line,
        guests, adults, youth, payment_status, outcome, excluded_reason, currency, selling_price, discount_amount,
        agent_commission, supplier_id, supplier_cost_source, supplier_cost_percent, supplier_cost, supplier_cost_currency)
      values (b.id, i + 1, v_trip_date, v_slug, trip ->> 'tour_name', dims.destination,
        case when b.type = 'transfer' then 'transfer' else coalesce(dims.product_line, 'tour') end,
        v_guests, v_adults, v_youth, b.payment_status::text, v_outcome, v_excluded, v_currency, line_net + line_discount, line_discount,
        v_agent, v_supplier, v_source, v_percent, v_cost, v_cost_currency);
    else
      update public.booking_financial_lines set
        trip_date = v_trip_date, tour_slug = v_slug, tour_name = trip ->> 'tour_name', destination = dims.destination,
        product_line = case when b.type = 'transfer' then 'transfer' else coalesce(dims.product_line, 'tour') end,
        guests = v_guests, adults = v_adults, youth = v_youth, payment_status = b.payment_status::text,
        outcome = v_outcome, excluded_reason = v_excluded, currency = v_currency,
        selling_price = line_net + line_discount, discount_amount = line_discount, agent_commission = v_agent,
        supplier_id = v_supplier, supplier_cost_source = v_source, supplier_cost_percent = v_percent,
        supplier_cost = v_cost, supplier_cost_currency = v_cost_currency
      where id = existing.id and (trip_date, tour_slug, tour_name, destination, product_line, guests, adults, youth, payment_status,
          outcome, excluded_reason, currency, selling_price, discount_amount, agent_commission, supplier_id, supplier_cost_source,
          supplier_cost_percent, supplier_cost, supplier_cost_currency)
        is distinct from (v_trip_date, v_slug, trip ->> 'tour_name', dims.destination,
          case when b.type = 'transfer' then 'transfer' else coalesce(dims.product_line, 'tour') end, v_guests, v_adults, v_youth,
          b.payment_status::text, v_outcome, v_excluded, v_currency, line_net + line_discount, line_discount, v_agent, v_supplier,
          v_source, v_percent, v_cost, v_cost_currency);
    end if;
  end loop;

  update public.booking_financial_lines set outcome = 'removed'
    where booking_id = b.id and line_no > n and outcome <> 'removed';
end $$;

-- Never let finance syncing block a booking write: failures are recorded and
-- surfaced in the finance admin instead.
create function public.finance_sync_booking_safe(p_booking_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_booking_id is null then return; end if;
  begin
    perform public.finance_sync_booking(p_booking_id);
  exception when others then
    insert into public.finance_sync_errors (booking_id, context, message) values (p_booking_id, 'booking_sync', sqlerrm);
  end;
end $$;

create function public.finance_booking_changed() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'bookings' then
    perform public.finance_sync_booking_safe(new.id);
  elsif tg_op = 'DELETE' then
    perform public.finance_sync_booking_safe(old.booking_id);
  else
    perform public.finance_sync_booking_safe(new.booking_id);
    if tg_op = 'UPDATE' and old.booking_id is distinct from new.booking_id then
      perform public.finance_sync_booking_safe(old.booking_id);
    end if;
  end if;
  return null;
end $$;

create trigger bookings_finance_sync after insert or update on public.bookings
  for each row execute function public.finance_booking_changed();
create trigger booking_assignments_finance_sync after insert or update or delete on public.booking_assignments
  for each row execute function public.finance_booking_changed();
create trigger booking_capacity_reservations_finance_sync after insert on public.booking_capacity_reservations
  for each row execute function public.finance_booking_changed();

create function public.finance_supplier_price_changed() returns trigger
language plpgsql security definer set search_path = '' as $$
declare target record;
begin
  for target in
    select distinct l.booking_id from public.booking_financial_lines l
    where l.supplier_id = coalesce(new.supplier_id, old.supplier_id) and l.tour_slug = coalesce(new.tour_slug, old.tour_slug)
      and (l.outcome in ('pending', 'active') or l.supplier_cost_source = 'none')
  loop
    perform public.finance_sync_booking_safe(target.booking_id);
  end loop;
  return null;
end $$;

create trigger supplier_prices_finance_sync after insert or update or delete on public.supplier_prices
  for each row execute function public.finance_supplier_price_changed();

create function public.finance_dimensions_changed() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.booking_financial_lines l set destination = new.destination,
    product_line = case when l.product_line = 'transfer' then 'transfer' else new.product_line end
  where l.tour_slug = new.tour_slug
    and (l.destination, l.product_line) is distinct from (new.destination, case when l.product_line = 'transfer' then 'transfer' else new.product_line end);
  return null;
end $$;

create trigger finance_tour_dimensions_changed after insert or update on public.finance_tour_dimensions
  for each row execute function public.finance_dimensions_changed();

-- ---------------------------------------------------------------------------
-- Views: per-line settlement status and per-supplier balances.
-- ---------------------------------------------------------------------------
-- Open balance per supplier, line and currency (reversals count toward the
-- type of the entry they reverse).
create view public.supplier_line_balances with (security_invoker = true) as
select e.supplier_id, e.line_id, e.currency,
  coalesce(sum(e.amount) filter (where coalesce(o.entry_type, e.entry_type) in ('supplier_cost_payable', 'commission_receivable')), 0) as obligation,
  sum(e.amount) as balance,
  sum(e.amount_usd) as balance_usd,
  count(*) filter (where e.amount_usd is null) as usd_pending_entries
from public.supplier_ledger e
left join public.supplier_ledger o on o.id = e.reverses_entry_id
where e.line_id is not null
group by e.supplier_id, e.line_id, e.currency;

-- Status of each line with its CURRENT supplier in its current ledger currency.
-- Entries with an earlier supplier (or in another currency) stay in
-- supplier_line_balances / supplier_balances for that supplier.
create view public.booking_financial_line_status with (security_invoker = true) as
select l.id as line_id, l.booking_id, l.supplier_id, l.collected_by, l.collection_status,
  public.finance_line_ledger_currency(l) as ledger_currency,
  coalesce(b.obligation, 0) as obligation,
  coalesce(b.balance, 0) as balance,
  case
    when not l.included or l.supplier_id is null or (l.collected_by = 'daily_red_sea' and l.recognised_supplier_cost = 0) then 'none'
    when l.collected_by = 'supplier' and (l.recognised_supplier_cost_booking_ccy is null
      or (l.supplier_cost_currency <> l.currency and not (l.fx_locked and l.supplier_fx_locked))) then 'awaiting_fx'
    when (l.collected_by = 'daily_red_sea' and not l.supplier_fx_locked)
      or (l.collected_by = 'supplier' and not (l.fx_locked and l.supplier_fx_locked)) then 'usd_pending'
    else 'posted' end as ledger_state,
  case
    when l.collected_by = 'supplier' or coalesce(b.obligation, 0) >= 0 or b.balance >= 0 then 'paid'
    when b.balance <= b.obligation then 'unpaid'
    else 'partial' end as supplier_cost_paid_status,
  case
    when l.collected_by = 'daily_red_sea' or coalesce(b.obligation, 0) <= 0 then 'not_applicable'
    when b.balance <= 0 then 'paid'
    when b.balance >= b.obligation then 'unpaid'
    else 'partial' end as commission_received_status
from public.booking_financial_lines l
left join public.supplier_line_balances b
  on b.line_id = l.id and b.supplier_id = l.supplier_id and b.currency = public.finance_line_ledger_currency(l);

create view public.supplier_balances with (security_invoker = true) as
select supplier_id, currency, sum(amount) as balance, sum(amount_usd) as balance_usd_at_posting,
  count(*) filter (where amount_usd is null) as usd_pending_entries, count(*) as entries, max(entry_date) as last_entry_date
from public.supplier_ledger
group by supplier_id, currency;

-- ---------------------------------------------------------------------------
-- Finance write RPCs (the only write path for signed-in staff).
-- ---------------------------------------------------------------------------
create function public.finance_require(p_permission text) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.admin_has_permission(p_permission) then
    raise exception 'Finance permission % is required.', p_permission using errcode = '42501';
  end if;
end $$;

-- p_changes keys (all optional): collected_by, collection_status, collected_amount,
-- no_show, payment_fees, agent_commission (null = automatic), refunded_amount
-- (null = automatic), supplier_cancellation_fee, supplier_id (null = automatic),
-- supplier_cost: {"mode": "auto" | "amount" | "percent", "amount", "currency", "percent"}.
create function public.finance_update_line(p_line_id uuid, p_changes jsonb)
returns public.booking_financial_lines
language plpgsql security definer set search_path = '' as $$
declare
  l public.booking_financial_lines;
  cost jsonb := p_changes -> 'supplier_cost';
  unknown text;
begin
  perform public.finance_require('manage_finance');
  if jsonb_typeof(p_changes) <> 'object' then raise exception 'Changes must be an object.' using errcode = '22023'; end if;
  select key into unknown from jsonb_object_keys(p_changes) key
    where key not in ('collected_by', 'collection_status', 'collected_amount', 'no_show', 'payment_fees', 'agent_commission',
      'refunded_amount', 'supplier_cancellation_fee', 'supplier_id', 'supplier_cost') limit 1;
  if unknown is not null then raise exception 'Unknown field %.', unknown using errcode = '22023'; end if;
  select * into l from public.booking_financial_lines where id = p_line_id for update;
  if not found then raise exception 'Financial line not found.' using errcode = 'P0002'; end if;

  if p_changes ? 'collected_by' then l.collected_by := (p_changes ->> 'collected_by')::public.finance_collector; end if;
  if p_changes ? 'collection_status' then l.collection_status := (p_changes ->> 'collection_status')::public.finance_collection_status; end if;
  if p_changes ? 'collected_amount' then l.collected_amount := (p_changes ->> 'collected_amount')::numeric; end if;
  if p_changes ? 'no_show' then l.no_show := (p_changes ->> 'no_show')::boolean; end if;
  if p_changes ? 'payment_fees' then l.payment_fees := (p_changes ->> 'payment_fees')::numeric; end if;
  if p_changes ? 'supplier_cancellation_fee' then l.supplier_cancellation_fee := (p_changes ->> 'supplier_cancellation_fee')::numeric; end if;
  if p_changes ? 'agent_commission' then
    l.agent_commission_manual := jsonb_typeof(p_changes -> 'agent_commission') <> 'null';
    if l.agent_commission_manual then l.agent_commission := (p_changes ->> 'agent_commission')::numeric; end if;
  end if;
  if p_changes ? 'refunded_amount' then
    l.refund_manual := jsonb_typeof(p_changes -> 'refunded_amount') <> 'null';
    if l.refund_manual then l.refunded_amount := (p_changes ->> 'refunded_amount')::numeric; end if;
  end if;
  if p_changes ? 'supplier_id' then
    l.supplier_manual := jsonb_typeof(p_changes -> 'supplier_id') <> 'null';
    l.supplier_id := case when l.supplier_manual then (p_changes ->> 'supplier_id')::uuid end;
    if not l.supplier_manual or l.supplier_cost_source not in ('manual_amount', 'manual_percent') then l.supplier_cost_source := 'none'; end if;
  end if;
  if cost is not null then
    case cost ->> 'mode'
      when 'auto' then l.supplier_cost_source := 'none';
      when 'amount' then
        l.supplier_cost_source := 'manual_amount';
        l.supplier_cost := (cost ->> 'amount')::numeric;
        l.supplier_cost_currency := (cost ->> 'currency')::public.finance_currency;
        l.supplier_cost_percent := null;
      when 'percent' then
        l.supplier_cost_source := 'manual_percent';
        l.supplier_cost_percent := (cost ->> 'percent')::numeric;
      else raise exception 'supplier_cost.mode must be auto, amount or percent.' using errcode = '22023';
    end case;
  end if;
  if l.collection_status = 'not_collected' then l.collected_amount := 0; end if;
  if l.collected_amount > l.net_selling_price then
    raise exception 'Collected amount (%) cannot exceed the net selling price (%).', l.collected_amount, l.net_selling_price using errcode = '23514';
  end if;

  update public.booking_financial_lines set
    collected_by = l.collected_by, collection_status = l.collection_status, collected_amount = l.collected_amount,
    no_show = l.no_show, payment_fees = l.payment_fees, supplier_cancellation_fee = l.supplier_cancellation_fee,
    agent_commission = l.agent_commission, agent_commission_manual = l.agent_commission_manual,
    refunded_amount = l.refunded_amount, refund_manual = l.refund_manual,
    supplier_id = l.supplier_id, supplier_manual = l.supplier_manual, supplier_cost_source = l.supplier_cost_source,
    supplier_cost = l.supplier_cost, supplier_cost_currency = l.supplier_cost_currency, supplier_cost_percent = l.supplier_cost_percent
  where id = l.id;

  -- Re-derive outcome (no-show), automatic supplier/cost/commission and exclusion.
  perform public.finance_sync_booking(l.booking_id);
  select * into l from public.booking_financial_lines where id = p_line_id;
  return l;
end $$;

-- Manual ledger entry. p_amount is always entered as a positive number; the
-- sign follows the entry type. Adjustments take a signed amount (positive =
-- supplier owes more) and require a note.
create function public.finance_post_supplier_entry(
  p_supplier_id uuid, p_entry_type text, p_amount numeric, p_currency text, p_entry_date date,
  p_line_id uuid default null, p_note text default null)
returns public.supplier_ledger
language plpgsql security definer set search_path = '' as $$
declare
  v_type public.finance_ledger_entry_type := p_entry_type::public.finance_ledger_entry_type;
  v_currency public.finance_currency := p_currency::public.finance_currency;
  l public.booking_financial_lines;
  saved public.supplier_ledger;
begin
  perform public.finance_require('manage_finance');
  if v_type not in ('payment_to_supplier', 'commission_received_from_supplier', 'adjustment') then
    raise exception 'Entry type % cannot be posted manually.', p_entry_type using errcode = '22023';
  end if;
  if p_amount is null or p_amount = 0 or (v_type <> 'adjustment' and p_amount < 0) then
    raise exception 'Enter a positive amount.' using errcode = '22023';
  end if;
  if p_entry_date is null then raise exception 'An entry date is required.' using errcode = '22023'; end if;
  if not exists (select 1 from public.suppliers where id = p_supplier_id) then
    raise exception 'Supplier not found.' using errcode = 'P0002';
  end if;
  if p_line_id is not null then
    -- Lock the line so balance reads and writes on it are serialized.
    select * into l from public.booking_financial_lines where id = p_line_id for update;
    if not found then raise exception 'That booking line does not belong to this supplier.' using errcode = '22023'; end if;
    if l.supplier_id is not distinct from p_supplier_id then
      if public.finance_line_ledger_currency(l) <> v_currency
         and not exists (select 1 from public.supplier_ledger e where e.line_id = l.id and e.supplier_id = p_supplier_id and e.currency = v_currency) then
        raise exception 'Entries against this booking must be in %.', public.finance_line_ledger_currency(l) using errcode = '22023';
      end if;
    elsif not exists (select 1 from public.supplier_ledger e where e.line_id = l.id and e.supplier_id = p_supplier_id) then
      raise exception 'That booking line does not belong to this supplier.' using errcode = '22023';
    elsif not exists (select 1 from public.supplier_ledger e where e.line_id = l.id and e.supplier_id = p_supplier_id and e.currency = v_currency) then
      raise exception 'This supplier has no % history on that booking.', v_currency using errcode = '22023';
    end if;
  end if;
  insert into public.supplier_ledger (supplier_id, booking_id, line_id, entry_type, amount, currency, entry_date, note)
  values (p_supplier_id, l.booking_id, p_line_id, v_type,
    case v_type when 'commission_received_from_supplier' then -p_amount else p_amount end,
    v_currency, p_entry_date, nullif(trim(coalesce(p_note, '')), ''))
  returning * into saved;
  return saved;
end $$;

-- Settlement headers. The id is the client-supplied idempotency key and is
-- also the settlement_id on every ledger entry of the settlement.
create table public.finance_settlements (
  id uuid primary key,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  line_ids uuid[] not null,
  entry_date date not null,
  note text,
  result jsonb not null,
  created_by uuid,
  created_by_email text not null default 'system',
  created_at timestamptz not null default now()
);
create trigger finance_settlements_no_update before update or delete on public.finance_settlements
  for each row execute function public.supplier_ledger_append_only();

-- Settles, for one supplier, every open (line, currency) balance on the
-- selected lines with one net_settlement entry each. Idempotent: repeating a
-- key returns the stored result; reusing a key for different input fails.
-- Selected lines are row-locked (in id order) before balances are read, so
-- concurrent settlements or payments on the same lines cannot double count.
create function public.finance_post_net_settlement(p_idempotency_key uuid, p_supplier_id uuid, p_line_ids uuid[], p_entry_date date, p_note text default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  existing public.finance_settlements;
  v_line_ids uuid[];
  target record;
  totals jsonb := '{}'::jsonb;
  posted integer := 0;
  v_result jsonb;
begin
  perform public.finance_require('manage_finance');
  if p_idempotency_key is null then raise exception 'An idempotency key is required.' using errcode = '22023'; end if;
  if p_line_ids is null or cardinality(p_line_ids) = 0 then raise exception 'Select at least one booking.' using errcode = '22023'; end if;
  if p_entry_date is null then raise exception 'An entry date is required.' using errcode = '22023'; end if;
  select array_agg(distinct x order by x) into v_line_ids from unnest(p_line_ids) x;

  perform pg_advisory_xact_lock(hashtextextended('finance_settlement:' || p_idempotency_key::text, 0));
  select * into existing from public.finance_settlements where id = p_idempotency_key;
  if found then
    if existing.supplier_id <> p_supplier_id or existing.line_ids <> v_line_ids or existing.entry_date <> p_entry_date then
      raise exception 'This idempotency key was already used for a different settlement.' using errcode = '22023';
    end if;
    return existing.result || jsonb_build_object('replayed', true);
  end if;

  if exists (select 1 from unnest(v_line_ids) as selected(line_id)
             left join public.booking_financial_lines l on l.id = selected.line_id
             where l.id is null or (l.supplier_id is distinct from p_supplier_id
               and not exists (select 1 from public.supplier_ledger e where e.line_id = l.id and e.supplier_id = p_supplier_id))) then
    raise exception 'Every selected booking must belong to this supplier.' using errcode = '22023';
  end if;

  perform 1 from public.booking_financial_lines where id = any (v_line_ids) order by id for update;

  for target in
    select b.line_id, l.booking_id, b.currency, b.balance
    from public.supplier_line_balances b join public.booking_financial_lines l on l.id = b.line_id
    where b.supplier_id = p_supplier_id and b.line_id = any (v_line_ids) and b.balance <> 0
    order by l.trip_date, b.line_id, b.currency
  loop
    insert into public.supplier_ledger (supplier_id, booking_id, line_id, entry_type, amount, currency, entry_date, settlement_id, note)
    values (p_supplier_id, target.booking_id, target.line_id, 'net_settlement', -target.balance, target.currency, p_entry_date,
      p_idempotency_key, nullif(trim(coalesce(p_note, '')), ''));
    totals := jsonb_set(totals, array[target.currency::text],
      to_jsonb(coalesce((totals ->> target.currency::text)::numeric, 0) - target.balance));
    posted := posted + 1;
  end loop;
  if posted = 0 then raise exception 'The selected bookings are already settled.' using errcode = '22023'; end if;

  v_result := jsonb_build_object('settlement_id', p_idempotency_key, 'entries', posted, 'net_by_currency', totals);
  insert into public.finance_settlements (id, supplier_id, line_ids, entry_date, note, result, created_by, created_by_email)
  values (p_idempotency_key, p_supplier_id, v_line_ids, p_entry_date, nullif(trim(coalesce(p_note, '')), ''), v_result, auth.uid(),
    coalesce(nullif(lower(coalesce(auth.jwt() ->> 'email', '')), ''), 'system'));
  return v_result;
end $$;

-- Corrects a manual entry by reversing it. Automatic entries follow the booking
-- and are corrected by changing the booking financials instead.
create function public.finance_reverse_supplier_entry(p_entry_id uuid, p_note text)
returns public.supplier_ledger
language plpgsql security definer set search_path = '' as $$
declare original public.supplier_ledger; saved public.supplier_ledger;
begin
  perform public.finance_require('manage_finance');
  select * into original from public.supplier_ledger where id = p_entry_id;
  if not found then raise exception 'Entry not found.' using errcode = 'P0002'; end if;
  if original.is_automatic then raise exception 'Automatic entries change with the booking; edit the booking financials instead.' using errcode = '22023'; end if;
  if original.entry_type = 'reversal' then raise exception 'A reversal cannot itself be reversed.' using errcode = '22023'; end if;
  if exists (select 1 from public.supplier_ledger where reverses_entry_id = p_entry_id) then
    raise exception 'This entry has already been reversed.' using errcode = '22023';
  end if;
  insert into public.supplier_ledger (supplier_id, entry_type, amount, currency, entry_date, reverses_entry_id, note)
  values (original.supplier_id, 'reversal', -original.amount, original.currency, current_date, original.id, p_note)
  returning * into saved;
  return saved;
end $$;

create function public.finance_void_expense(p_expense_id uuid, p_reason text)
returns public.expenses
language plpgsql security definer set search_path = '' as $$
declare saved public.expenses;
begin
  perform public.finance_require('manage_finance');
  if length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'A void reason is required.' using errcode = '22023'; end if;
  update public.expenses set voided_at = now(), voided_by = auth.uid(), void_reason = trim(p_reason)
    where id = p_expense_id and voided_at is null returning * into saved;
  if not found then raise exception 'Expense not found or already voided.' using errcode = 'P0002'; end if;
  return saved;
end $$;

-- Admin override of a daily rate. Records that already locked a rate keep it;
-- unlocked (provisional) records pick the override up on the next refresh.
create function public.finance_set_fx_rate(p_rate_date date, p_currency text, p_units_per_usd numeric, p_note text default null)
returns public.fx_rates
language plpgsql security definer set search_path = '' as $$
declare saved public.fx_rates;
begin
  perform public.finance_require('manage_finance');
  if p_currency = 'USD' then raise exception 'USD is the reporting currency.' using errcode = '22023'; end if;
  if p_rate_date is null or p_rate_date > current_date then raise exception 'Choose a rate date that is not in the future.' using errcode = '22023'; end if;
  if p_units_per_usd is null or p_units_per_usd <= 0 then raise exception 'Enter a positive rate.' using errcode = '22023'; end if;
  insert into public.fx_rates (rate_date, currency, units_per_usd, source, note, set_by, fetched_at)
  values (p_rate_date, p_currency::public.finance_currency, p_units_per_usd, 'manual', p_note, auth.uid(), now())
  on conflict (rate_date, currency) do update set units_per_usd = excluded.units_per_usd, source = 'manual',
    note = excluded.note, set_by = excluded.set_by, fetched_at = excluded.fetched_at
  returning * into saved;
  perform public.finance_refresh_unlocked_fx();
  return saved;
end $$;

-- Re-converts every record whose rate is still provisional. Run after each
-- daily rate snapshot.
create function public.finance_refresh_unlocked_fx() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare lines_updated integer; expenses_updated integer;
begin
  update public.booking_financial_lines set updated_at = now() where not fx_locked or not supplier_fx_locked;
  get diagnostics lines_updated = row_count;
  update public.expenses set updated_at = now() where not fx_locked and voided_at is null;
  get diagnostics expenses_updated = row_count;
  return jsonb_build_object('lines', lines_updated, 'expenses', expenses_updated);
end $$;

create function public.finance_sync_all_bookings() returns integer
language plpgsql security definer set search_path = '' as $$
declare target record; total integer := 0;
begin
  for target in select id from public.bookings order by created_at loop
    perform public.finance_sync_booking_safe(target.id);
    total := total + 1;
  end loop;
  return total;
end $$;

alter table public.supplier_ledger enable row level security;
create policy "Finance staff read supplier ledger" on public.supplier_ledger for select to authenticated using (public.admin_has_permission('view_finance'));
alter table public.finance_settlements enable row level security;
create policy "Finance staff read settlements" on public.finance_settlements for select to authenticated using (public.admin_has_permission('view_finance'));
create trigger finance_settlements_audit after insert on public.finance_settlements
  for each row execute function public.finance_audit_trigger('id');
revoke all on public.finance_settlements from anon, authenticated;
grant select on public.finance_settlements to authenticated;
grant select, insert on public.finance_settlements to service_role;

revoke all on public.supplier_ledger from anon, authenticated;
grant select on public.supplier_ledger to authenticated;
grant select, insert on public.supplier_ledger to service_role;
revoke all on public.booking_financial_line_status, public.supplier_balances, public.supplier_line_balances from anon, authenticated;
grant select on public.booking_financial_line_status, public.supplier_balances, public.supplier_line_balances to authenticated, service_role;

do $$
declare fn text;
begin
  foreach fn in array array[
    'public.supplier_ledger_append_only()', 'public.supplier_ledger_before_insert()',
    'public.finance_sync_line_ledger(uuid)', 'public.finance_line_after_write()', 'public.finance_sync_booking(uuid)',
    'public.finance_sync_booking_safe(uuid)', 'public.finance_booking_changed()', 'public.finance_supplier_price_changed()',
    'public.finance_dimensions_changed()', 'public.finance_refresh_unlocked_fx()', 'public.finance_sync_all_bookings()',
    'public.finance_require(text)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;
  foreach fn in array array[
    'public.finance_update_line(uuid, jsonb)',
    'public.finance_post_supplier_entry(uuid, text, numeric, text, date, uuid, text)',
    'public.finance_post_net_settlement(uuid, uuid, uuid[], date, text)',
    'public.finance_reverse_supplier_entry(uuid, text)',
    'public.finance_void_expense(uuid, text)',
    'public.finance_set_fx_rate(date, text, numeric, text)'
  ] loop
    execute format('revoke all on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end $$;
grant execute on function public.finance_refresh_unlocked_fx() to service_role;
grant execute on function public.finance_sync_all_bookings() to service_role;
grant execute on function public.finance_sync_booking_safe(uuid) to service_role;

-- Backfill every existing booking (no-op on an empty database).
select public.finance_sync_all_bookings();
