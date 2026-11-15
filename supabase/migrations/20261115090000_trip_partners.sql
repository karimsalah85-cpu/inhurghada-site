-- Several suppliers per trip, set once on the trip itself.
--
-- A trip (tour) can now list its partners in public.tour_partners: one MAIN
-- partner (the trip provider, e.g. the boat company) and any number of EXTRA
-- partners (e.g. a separate transfer company, a guide, a hotel).
--
-- Every booking of that trip picks them up automatically while the trip is
-- still pending or active:
--   * the main partner becomes the trip's supplier when the booking has no
--     supplier assignment of its own (an assignment or a manual choice in
--     finance still wins). The main partner keeps the existing finance rules:
--     if they collect the guest's money they owe Daily Red Sea the net sale
--     minus their own cost; otherwise Daily Red Sea owes them their cost.
--   * each extra partner is added as a partner cost on the trip
--     (booking_line_partner_costs, flagged from_trip_setup), priced from the
--     supplier's price list for that trip (per person, fixed or percentage),
--     so Daily Red Sea owes them that cost and the margin subtracts it.
--     Without a price the partner is added at cost 0 for finance to fill in.
--     Price-list costs follow guest-count changes while the trip is open.
--
-- Finished trips (completed / cancelled / no-show) are never changed, and a
-- partner that finance removed from one booking is not added back.
-- A new partner role, 'transfer', is available everywhere.

alter table public.booking_line_partner_costs drop constraint booking_line_partner_costs_role_check;
alter table public.booking_line_partner_costs add constraint booking_line_partner_costs_role_check
  check (role in ('boat', 'guide', 'driver', 'hotel', 'transfer', 'company', 'other'));
alter table public.booking_line_partner_costs add column from_trip_setup boolean not null default false;

create table public.tour_partners (
  id uuid primary key default gen_random_uuid(),
  tour_slug text not null check (length(trim(tour_slug)) > 0),
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  role text not null check (role in ('main', 'boat', 'guide', 'driver', 'hotel', 'transfer', 'company', 'other')),
  note text check (note is null or length(note) <= 500),
  created_by_email text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tour_slug, supplier_id)
);
create unique index tour_partners_one_main on public.tour_partners (tour_slug) where role = 'main';
create index tour_partners_supplier_idx on public.tour_partners (supplier_id);

-- What a supplier charges for one trip from their price list, or no row.
create function public.finance_partner_list_price(p_supplier_id uuid, p_line_id uuid)
returns table (cost numeric, currency public.finance_currency)
language plpgsql stable security definer set search_path = '' as $$
declare l public.booking_financial_lines; price record;
begin
  select * into l from public.booking_financial_lines where id = p_line_id;
  if not found or l.tour_slug is null then return; end if;
  select sp.* into price from public.supplier_prices sp
    where sp.supplier_id = p_supplier_id and sp.tour_slug = l.tour_slug
      and (sp.valid_from is null or l.trip_date is null or sp.valid_from <= l.trip_date)
      and (sp.valid_to is null or l.trip_date is null or sp.valid_to >= l.trip_date)
    order by sp.valid_from desc nulls last limit 1;
  if not found or upper(price.currency) not in ('USD', 'EUR', 'GBP', 'EGP', 'SAR') then return; end if;
  if price.cost_percent is not null then
    cost := round(l.net_selling_price * price.cost_percent / 100, 2); currency := l.currency;
  else
    cost := price.adult_cost * (case when l.adults + l.youth = 0 then l.guests else l.adults end)
      + coalesce(price.youth_cost, price.adult_cost) * l.youth + coalesce(price.fixed_cost, 0);
    currency := upper(price.currency)::public.finance_currency;
  end if;
  return next;
end $$;

-- Adds the trip setup's extra partners to a booking's open trips and keeps
-- price-list costs in step with the trip (guests, date, price changes).
create function public.finance_apply_tour_partners(p_booking_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare r record; p record;
begin
  for r in
    select l.id as line_id, l.booking_id, l.currency as line_currency, tp.supplier_id, tp.role, s.default_currency
    from public.booking_financial_lines l
    join public.tour_partners tp on tp.tour_slug = l.tour_slug and tp.role <> 'main'
    join public.suppliers s on s.id = tp.supplier_id and s.active
    where l.booking_id = p_booking_id and l.outcome in ('pending', 'active')
      and l.supplier_id is distinct from tp.supplier_id
      and not exists (select 1 from public.booking_line_partner_costs c where c.line_id = l.id and c.supplier_id = tp.supplier_id
        and (c.status = 'active' or c.removed_reason is distinct from 'Removed from the trip setup'))
  loop
    select * into p from public.finance_partner_list_price(r.supplier_id, r.line_id);
    insert into public.booking_line_partner_costs (line_id, booking_id, supplier_id, role, cost, currency, cost_source, note, from_trip_setup)
    values (r.line_id, r.booking_id, r.supplier_id, r.role,
      coalesce(p.cost, 0),
      coalesce(p.currency, case when upper(coalesce(r.default_currency, '')) in ('USD', 'EUR', 'GBP', 'EGP', 'SAR')
        then upper(r.default_currency)::public.finance_currency else r.line_currency end),
      case when p.cost is null then 'manual' else 'supplier_price' end,
      case when p.cost is null then 'From the trip setup: no price for this trip yet, enter the cost.' else 'From the trip setup.' end,
      true);
  end loop;

  -- Trip-setup partners whose role changed in the setup.
  update public.booking_line_partner_costs c set role = tp.role
  from public.booking_financial_lines l, public.tour_partners tp
  where c.booking_id = p_booking_id and c.from_trip_setup and c.status = 'active' and l.id = c.line_id
    and l.outcome in ('pending', 'active') and tp.tour_slug = l.tour_slug and tp.supplier_id = c.supplier_id
    and tp.role <> 'main' and c.role <> tp.role;

  -- Price-list costs follow the trip while it is open.
  for r in
    select c.id, c.supplier_id, c.line_id, c.cost, c.currency from public.booking_line_partner_costs c
    join public.booking_financial_lines l on l.id = c.line_id
    where c.booking_id = p_booking_id and c.status = 'active' and c.cost_source = 'supplier_price' and l.outcome in ('pending', 'active')
  loop
    select * into p from public.finance_partner_list_price(r.supplier_id, r.line_id);
    if p.cost is not null and (p.cost, p.currency) is distinct from (r.cost, r.currency) then
      update public.booking_line_partner_costs set cost = p.cost, currency = p.currency where id = r.id;
    end if;
  end loop;
end $$;

create or replace function public.finance_sync_booking(p_booking_id uuid) returns void
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
  v_tour_main uuid;
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

    -- Supplier: a manual choice wins, then the booking's supplier assignment,
    -- then the trip's main partner from its trip setup (public.tour_partners).
    -- The trip setup only fills trips that are still pending or active, so
    -- finished trips never pick up a partner after the fact.
    select tp.supplier_id into v_tour_main from public.tour_partners tp join public.suppliers s on s.id = tp.supplier_id
      where tp.tour_slug = v_slug and tp.role = 'main' and s.active;
    v_supplier := case
      when found_existing and existing.supplier_manual then existing.supplier_id
      when (n = 1 or supplier_count = 1) and assignment.supplier_id is not null then assignment.supplier_id
      when v_tour_main is not null and (not found_existing or existing.outcome in ('pending', 'active')
           or existing.supplier_id is not distinct from v_tour_main) then v_tour_main
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

create or replace function public.finance_sync_booking_safe(p_booking_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_booking_id is null then return; end if;
  begin
    perform public.finance_sync_booking(p_booking_id);
    perform public.finance_apply_tour_partners(p_booking_id);
    perform public.finance_apply_guest_payments(p_booking_id);
  exception when others then
    insert into public.finance_sync_errors (booking_id, context, message) values (p_booking_id, 'booking_sync', sqlerrm);
  end;
end $$;

-- A price change also reaches trips where the supplier is an extra partner.
create or replace function public.finance_supplier_price_changed() returns trigger
language plpgsql security definer set search_path = '' as $$
declare target record;
begin
  for target in
    select distinct l.booking_id from public.booking_financial_lines l
    where l.tour_slug = coalesce(new.tour_slug, old.tour_slug)
      and ((l.supplier_id = coalesce(new.supplier_id, old.supplier_id)
            and (l.outcome in ('pending', 'active') or l.supplier_cost_source = 'none'))
        or (l.outcome in ('pending', 'active') and exists (select 1 from public.booking_line_partner_costs c
            where c.line_id = l.id and c.supplier_id = coalesce(new.supplier_id, old.supplier_id) and c.status = 'active')))
  loop
    perform public.finance_sync_booking_safe(target.booking_id);
  end loop;
  return null;
end $$;

-- Changing a trip's setup updates every open booking of that trip.
create function public.tour_partners_changed() returns trigger
language plpgsql security definer set search_path = '' as $$
declare target record; v_slug text := coalesce(new.tour_slug, old.tour_slug);
begin
  -- An extra partner taken off the setup (or promoted to main) leaves open trips.
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and (new.role = 'main' or new.supplier_id <> old.supplier_id or new.tour_slug <> old.tour_slug)) then
    update public.booking_line_partner_costs c set status = 'removed', removed_at = now(), removed_reason = 'Removed from the trip setup'
    from public.booking_financial_lines l
    where l.id = c.line_id and c.from_trip_setup and c.status = 'active' and c.supplier_id = old.supplier_id
      and l.tour_slug = old.tour_slug and l.outcome in ('pending', 'active');
  end if;
  for target in
    select distinct l.booking_id from public.booking_financial_lines l
    where l.tour_slug in (v_slug, old.tour_slug) and l.outcome in ('pending', 'active')
  loop
    perform public.finance_sync_booking_safe(target.booking_id);
  end loop;
  return null;
end $$;

create function public.tour_partners_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    new.created_by_email := coalesce(nullif(lower(coalesce(auth.jwt() ->> 'email', '')), ''), 'system');
  end if;
  return new;
end $$;

create trigger tour_partners_touch before insert or update on public.tour_partners
  for each row execute function public.tour_partners_touch();
create trigger tour_partners_finance_sync after insert or update or delete on public.tour_partners
  for each row execute function public.tour_partners_changed();
create trigger tour_partners_audit after insert or update or delete on public.tour_partners
  for each row execute function public.finance_audit_trigger('id');

alter table public.tour_partners enable row level security;
create policy "Staff read trip partners" on public.tour_partners for select to authenticated
  using (public.admin_has_permission('suppliers') or public.admin_has_permission('view_finance') or public.admin_has_permission('operations'));
create policy "Supplier managers write trip partners" on public.tour_partners for all to authenticated
  using (public.admin_has_permission('suppliers')) with check (public.admin_has_permission('suppliers'));
revoke all on public.tour_partners from anon, authenticated;
grant select, insert, update, delete on public.tour_partners to authenticated;
grant all on public.tour_partners to service_role;

do $$
declare fn text;
begin
  foreach fn in array array[
    'public.finance_partner_list_price(uuid, uuid)', 'public.finance_apply_tour_partners(uuid)',
    'public.tour_partners_changed()', 'public.tour_partners_touch()'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;
end $$;
