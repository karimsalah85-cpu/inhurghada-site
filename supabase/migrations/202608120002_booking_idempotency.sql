-- Durable, transaction-scoped booking idempotency and notification delivery leases.
create table if not exists public.booking_submission_idempotency (
  idempotency_key uuid primary key,
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  booking_id uuid unique references public.bookings(id) on delete restrict,
  state text not null default 'processing' check (state in ('processing','completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check ((state = 'processing' and booking_id is null and completed_at is null)
    or (state = 'completed' and booking_id is not null and completed_at is not null))
);

create table if not exists public.booking_notification_deliveries (
  booking_id uuid not null references public.bookings(id) on delete cascade,
  notification_kind text not null check (notification_kind in ('operator_whatsapp','operator_email','customer_email')),
  state text not null default 'pending' check (state in ('pending','sending','sent','failed')),
  attempts integer not null default 0 check (attempts between 0 and 5),
  lease_started_at timestamptz,
  sent_at timestamptz,
  last_error text check (last_error is null or length(last_error) <= 500),
  primary key (booking_id, notification_kind)
);

alter table public.booking_submission_idempotency enable row level security;
alter table public.booking_notification_deliveries enable row level security;
revoke all on public.booking_submission_idempotency from public, anon, authenticated;
revoke all on public.booking_notification_deliveries from public, anon, authenticated;
grant all on public.booking_submission_idempotency to service_role;
grant all on public.booking_notification_deliveries to service_role;

create or replace function public.reserve_booking_idempotent(
  p_idempotency_key uuid, p_request_hash text, p_reference text,
  p_type text, p_customer_name text, p_customer_email text, p_phone text,
  p_tour_name text, p_tour_slug text, p_date date, p_start_time time,
  p_guests integer, p_adults integer, p_youth integer, p_infants integer,
  p_hotel text, p_notes text, p_amount numeric, p_currency text, p_locale text,
  p_items jsonb default null
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
      p_amount,p_currency,p_locale
    );
  end if;

  insert into public.booking_notification_deliveries(booking_id, notification_kind)
  values (created.id,'operator_whatsapp'),(created.id,'operator_email'),(created.id,'customer_email');
  update public.booking_submission_idempotency
  set booking_id=created.id,state='completed',completed_at=now()
  where idempotency_key=p_idempotency_key;
  return jsonb_build_object('booking', to_jsonb(created), 'replayed', false);
end $$;

create or replace function public.claim_booking_notification(p_booking_id uuid, p_notification_kind text)
returns boolean language plpgsql security definer set search_path='' as $$
declare claimed boolean;
begin
  update public.booking_notification_deliveries
  set state='sending', attempts=attempts+1, lease_started_at=now(), last_error=null
  where booking_id=p_booking_id and notification_kind=p_notification_kind
    and attempts < 5
    and state in ('pending','failed');
  get diagnostics claimed = row_count;
  return claimed;
end $$;

create or replace function public.finish_booking_notification(
  p_booking_id uuid, p_notification_kind text, p_success boolean, p_error text default null
) returns void language plpgsql security definer set search_path='' as $$
begin
  update public.booking_notification_deliveries
  set state=case when p_success then 'sent' else 'failed' end,
      sent_at=case when p_success then now() else null end,
      lease_started_at=null,
      last_error=case when p_success then null else left(coalesce(p_error,'Delivery failed.'),500) end
  where booking_id=p_booking_id and notification_kind=p_notification_kind and state='sending';
end $$;

revoke all on function public.reserve_booking_idempotent(uuid,text,text,text,text,text,text,text,text,date,time,integer,integer,integer,integer,text,text,numeric,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.reserve_booking_idempotent(uuid,text,text,text,text,text,text,text,text,date,time,integer,integer,integer,integer,text,text,numeric,text,text,jsonb) to service_role;
revoke all on function public.claim_booking_notification(uuid,text) from public,anon,authenticated;
grant execute on function public.claim_booking_notification(uuid,text) to service_role;
revoke all on function public.finish_booking_notification(uuid,text,boolean,text) from public,anon,authenticated;
grant execute on function public.finish_booking_notification(uuid,text,boolean,text) to service_role;
