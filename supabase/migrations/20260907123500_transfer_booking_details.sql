-- Per-vehicle airport transfer bookings carry more structured data than the
-- shared bookings columns model (route/zone, passenger split, luggage, oversized
-- items, child seats, allocated vehicles, pricing snapshot + pricing version).
--
-- This migration:
--   1. adds a nullable JSONB column `bookings.transfer_details`;
--   2. extends reserve_booking + reserve_booking_idempotent with a trailing
--      `p_transfer_details jsonb default null` argument that is persisted into it.
--
-- Backwards compatible: the new argument defaults to NULL, so every existing
-- caller (tour bookings, multi-trip bookings) keeps working unchanged. The old
-- function signatures are dropped and recreated because PostgreSQL identifies
-- functions by their full argument list.
--
-- Deploy ordering: this migration is safe to apply at any time (it is purely
-- additive and every existing caller keeps working via the default argument).
-- The application does NOT yet pass p_transfer_details — the booking route
-- intentionally does not branch on RPC error codes, so the code switch to send
-- it is a one-line follow-up made AFTER this migration is confirmed applied.
-- Until then the same information is persisted human-readably in bookings.notes.

alter table public.bookings
  add column if not exists transfer_details jsonb;

comment on column public.bookings.transfer_details is
  'Structured snapshot for per-vehicle airport transfers: route, zone, passenger split, luggage, oversized items, child seats, allocated vehicles, fare and pricing version. Nullable; populated for airport-v2 transfer bookings.';

-- reserve_booking -------------------------------------------------------------
drop function if exists public.reserve_booking(text,text,text,text,text,text,text,date,time,integer,integer,integer,integer,text,text,numeric,text,text);

create function public.reserve_booking(
  p_reference text, p_type text, p_customer_name text, p_customer_email text, p_phone text,
  p_tour_name text, p_tour_slug text, p_date date, p_start_time time, p_guests integer,
  p_adults integer, p_youth integer, p_infants integer, p_hotel text, p_notes text,
  p_amount numeric, p_currency text, p_locale text, p_transfer_details jsonb default null
) returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare slot public.tour_availability; created public.bookings;
begin
  if p_guests < 1 then raise exception using errcode = '22023', message = 'At least one guest is required.'; end if;
  select * into slot from public.tour_availability
  where tour_slug = p_tour_slug and service_date = p_date
    and (start_time is null or p_start_time is null or start_time = p_start_time)
  order by (start_time = p_start_time) desc nulls last limit 1 for update;
  if found then
    if slot.blocked then raise exception using errcode = 'P0001', message = 'This date is sold out.'; end if;
    if slot.capacity is not null and slot.reserved + p_guests > slot.capacity then
      raise exception using errcode = 'P0001', message = format('Only %s places remain.', greatest(slot.capacity - slot.reserved, 0));
    end if;
    update public.tour_availability set reserved = reserved + p_guests, updated_at = now() where id = slot.id;
  end if;
  insert into public.bookings (reference,type,customer_name,customer_email,phone,tour_name,tour_slug,date,start_time,guests,adults,youth,infants,hotel,notes,amount,currency,locale,transfer_details)
  values (p_reference,p_type,p_customer_name,lower(p_customer_email),p_phone,p_tour_name,p_tour_slug,p_date,p_start_time,p_guests,p_adults,p_youth,p_infants,p_hotel,p_notes,p_amount,p_currency,p_locale,p_transfer_details)
  returning * into created;
  insert into public.customer_profiles (customer_key,name,email,phone,preferred_language,last_booking_at)
  values (coalesce(nullif(lower(p_customer_email),''),p_phone),p_customer_name,lower(p_customer_email),p_phone,p_locale,now())
  on conflict (customer_key) do update set name=excluded.name,email=excluded.email,phone=excluded.phone,preferred_language=excluded.preferred_language,last_booking_at=now(),updated_at=now();
  return created;
end $$;

revoke all on function public.reserve_booking(text,text,text,text,text,text,text,date,time,integer,integer,integer,integer,text,text,numeric,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.reserve_booking(text,text,text,text,text,text,text,date,time,integer,integer,integer,integer,text,text,numeric,text,text,jsonb) to service_role;

-- reserve_booking_idempotent ------------------------------------------------
drop function if exists public.reserve_booking_idempotent(uuid,text,text,text,text,text,text,text,text,date,time,integer,integer,integer,integer,text,text,numeric,text,text,jsonb);

create function public.reserve_booking_idempotent(
  p_idempotency_key uuid, p_request_hash text, p_reference text,
  p_type text, p_customer_name text, p_customer_email text, p_phone text,
  p_tour_name text, p_tour_slug text, p_date date, p_start_time time,
  p_guests integer, p_adults integer, p_youth integer, p_infants integer,
  p_hotel text, p_notes text, p_amount numeric, p_currency text, p_locale text,
  p_items jsonb default null, p_transfer_details jsonb default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  ledger public.booking_submission_idempotency;
  created public.bookings;
  affected integer;
  item jsonb;
begin
  if p_request_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode='22023', message='Invalid booking request hash.';
  end if;

  insert into public.booking_submission_idempotency(idempotency_key, request_hash)
  values (p_idempotency_key, p_request_hash)
  on conflict (idempotency_key) do nothing;
  get diagnostics affected = row_count;

  select * into ledger from public.booking_submission_idempotency
  where idempotency_key = p_idempotency_key for update;
  if ledger.request_hash <> p_request_hash then
    raise exception using errcode='22023', message='This booking attempt key was already used for different booking details.';
  end if;
  if affected = 0 and ledger.state = 'completed' then
    select * into strict created from public.bookings where id = ledger.booking_id;
    return jsonb_build_object('booking', to_jsonb(created), 'replayed', true);
  end if;

  if p_type = 'tour' then
    if p_tour_slug = 'multi-trip' then
      for item in select * from jsonb_array_elements(coalesce(p_items,'[]'::jsonb)) loop
        if exists (select 1 from public.content_items where content_type='tour' and locale='en'
          and slug=item->>'tour_slug' and (status <> 'published' or listing_status <> 'active')) then
          raise exception using errcode='P0001', message='A selected trip is unavailable for new bookings.';
        end if;
      end loop;
    elsif exists (select 1 from public.content_items where content_type='tour' and locale='en'
      and slug=p_tour_slug and (status <> 'published' or listing_status <> 'active')) then
      raise exception using errcode='P0001', message='This trip is unavailable for new bookings.';
    end if;
  end if;

  if p_tour_slug = 'multi-trip' then
    created := public.reserve_multi_trip_booking(
      p_reference,p_customer_name,p_customer_email,p_phone,p_tour_name,p_date,p_guests,
      p_hotel,p_notes,p_amount,p_currency,p_locale,p_items
    );
  else
    created := public.reserve_booking(
      p_reference,p_type,p_customer_name,p_customer_email,p_phone,p_tour_name,p_tour_slug,
      p_date,p_start_time,p_guests,p_adults,p_youth,p_infants,p_hotel,p_notes,
      p_amount,p_currency,p_locale,p_transfer_details
    );
  end if;

  insert into public.booking_notification_deliveries(booking_id, notification_kind)
  values (created.id,'operator_whatsapp'),(created.id,'operator_email'),(created.id,'customer_email');
  update public.booking_submission_idempotency
  set booking_id=created.id,state='completed',completed_at=now()
  where idempotency_key=p_idempotency_key;
  return jsonb_build_object('booking', to_jsonb(created), 'replayed', false);
end $$;

revoke all on function public.reserve_booking_idempotent(uuid,text,text,text,text,text,text,text,text,date,time,integer,integer,integer,integer,text,text,numeric,text,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.reserve_booking_idempotent(uuid,text,text,text,text,text,text,text,text,date,time,integer,integer,integer,integer,text,text,numeric,text,text,jsonb,jsonb) to service_role;
