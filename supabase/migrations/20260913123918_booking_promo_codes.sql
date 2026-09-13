create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9][A-Z0-9_-]{2,31}$'),
  discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value numeric(12,2) not null check (discount_value > 0),
  currency text check (currency in ('USD','EUR','SAR')),
  minimum_amount numeric(12,2) not null default 0 check (minimum_amount >= 0),
  tour_slug text,
  starts_at timestamptz,
  expires_at timestamptz,
  max_redemptions integer check (max_redemptions > 0),
  redeemed_count integer not null default 0 check (redeemed_count >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (discount_type <> 'percent' or discount_value <= 100),
  check (discount_type <> 'fixed' or currency is not null),
  check (minimum_amount = 0 or currency is not null),
  check (expires_at is null or starts_at is null or expires_at > starts_at)
);
alter table public.promo_codes enable row level security;
revoke all on public.promo_codes from public, anon, authenticated;
grant all on public.promo_codes to service_role;

alter table public.bookings add column promo_code text;
alter table public.bookings add column subtotal numeric(12,2);
alter table public.bookings add column discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0);
alter table public.bookings add column trip_id text;

create table public.promo_redemptions (
  booking_id uuid primary key references public.bookings(id) on delete restrict,
  promo_id uuid not null references public.promo_codes(id) on delete restrict,
  discount_amount numeric(12,2) not null check (discount_amount > 0),
  created_at timestamptz not null default now()
);
create index promo_redemptions_promo_id_idx on public.promo_redemptions(promo_id);
alter table public.promo_redemptions enable row level security;
revoke all on public.promo_redemptions from public, anon, authenticated;
grant all on public.promo_redemptions to service_role;

-- The existing reservation function still owns capacity and idempotency. This
-- service-role-only wrapper adds a locked redemption in the same transaction.
create function public.reserve_booking_with_promo(
  p_idempotency_key uuid, p_request_hash text, p_reference text,
  p_type text, p_customer_name text, p_customer_email text, p_phone text,
  p_tour_name text, p_tour_slug text, p_date date, p_start_time time,
  p_guests integer, p_adults integer, p_youth integer, p_infants integer,
  p_hotel text, p_notes text, p_amount numeric, p_currency text, p_locale text,
  p_items jsonb default null, p_promo_code text default null
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  promo public.promo_codes;
  ledger public.booking_submission_idempotency;
  saved public.bookings;
  result jsonb;
  discount numeric := 0;
  v_code text := nullif(upper(trim(p_promo_code)), '');
  reference_id text;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));
  select * into ledger from public.booking_submission_idempotency where idempotency_key = p_idempotency_key;
  if found then
    if ledger.request_hash <> p_request_hash then
      raise exception 'This booking attempt key was already used for different booking details.';
    end if;
    if ledger.state = 'completed' then
      select * into strict saved from public.bookings where id = ledger.booking_id;
      return jsonb_build_object('booking', to_jsonb(saved), 'replayed', true);
    end if;
  end if;
  if v_code is not null then
    select * into promo from public.promo_codes where promo_codes.code = v_code for update;
    if not found or not promo.active or p_type <> 'tour'
      or (promo.starts_at is not null and promo.starts_at > now())
      or (promo.expires_at is not null and promo.expires_at <= now())
      or (promo.max_redemptions is not null and promo.redeemed_count >= promo.max_redemptions)
      or (promo.currency is not null and promo.currency <> upper(p_currency))
      or p_amount <= 0 or p_amount < promo.minimum_amount then
      raise exception 'Promo code is invalid, expired or not eligible for this booking.';
    end if;
    if promo.tour_slug is not null then
      if p_tour_slug = 'multi-trip' then
        if p_items is null or jsonb_array_length(p_items) = 0 or exists (
          select 1 from jsonb_array_elements(p_items) item where item->>'tour_slug' is distinct from promo.tour_slug
        ) then raise exception 'Promo code does not apply to every trip in this booking.'; end if;
      elsif p_tour_slug is distinct from promo.tour_slug then
        raise exception 'Promo code does not apply to this trip.';
      end if;
    end if;
    discount := least(p_amount, round(case when promo.discount_type = 'percent' then p_amount * promo.discount_value / 100 else promo.discount_value end, 2));
    if discount <= 0 then raise exception 'Promo code gives no discount on this booking.'; end if;
  end if;
  select trip_id into reference_id from public.content_items where content_type='tour' and locale='en' and slug=p_tour_slug;
  result := public.reserve_booking_idempotent(
    p_idempotency_key,p_request_hash,p_reference,p_type,p_customer_name,p_customer_email,p_phone,
    p_tour_name,p_tour_slug,p_date,p_start_time,p_guests,p_adults,p_youth,p_infants,p_hotel,p_notes,
    p_amount-discount,p_currency,p_locale,p_items
  );
  -- A previous application version can have completed this key concurrently.
  if (result->>'replayed')::boolean then return result; end if;
  update public.bookings set promo_code=v_code, subtotal=p_amount, discount_amount=discount, trip_id=reference_id
    where id=(result->'booking'->>'id')::uuid returning * into saved;
  if v_code is not null then
    insert into public.promo_redemptions(booking_id,promo_id,discount_amount) values(saved.id,promo.id,discount);
    update public.promo_codes set redeemed_count=redeemed_count+1 where id=promo.id;
  end if;
  return jsonb_build_object('booking',to_jsonb(saved),'replayed',false);
end $$;
revoke all on function public.reserve_booking_with_promo(uuid,text,text,text,text,text,text,text,text,date,time,integer,integer,integer,integer,text,text,numeric,text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.reserve_booking_with_promo(uuid,text,text,text,text,text,text,text,text,date,time,integer,integer,integer,integer,text,text,numeric,text,text,jsonb,text) to service_role;
