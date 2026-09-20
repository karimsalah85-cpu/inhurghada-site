-- Customer referral program ("Give 5% — Get 5%").
-- Additive rollout: existing bookings/customers keep working without referral data.
-- Reuses the row-locked, idempotency-ledger pattern from reserve_booking_with_promo/reserve_booking_with_pricing.

-- A lightweight customer identity, keyed the same way admin_customer_summary derives
-- "distinct customer" (normalized email, else digits-only phone) so referral accounting
-- stays consistent with existing customer-dedup reporting.
create table public.referral_identities (
  customer_key text primary key,
  referral_code text not null unique check (referral_code ~ '^DRS-[A-Z0-9]{6}$'),
  customer_name text,
  customer_email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referral_code text not null references public.referral_identities(referral_code),
  referrer_customer_key text not null references public.referral_identities(customer_key),
  referred_customer_key text not null,
  referred_booking_id uuid not null unique references public.bookings(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'qualified', 'reversed', 'cancelled')),
  discount_percent numeric(5,2) not null default 0 check (discount_percent >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  created_at timestamptz not null default now(),
  qualified_at timestamptz,
  reversed_at timestamptz,
  check (referrer_customer_key <> referred_customer_key),
  -- First-booking rule: a given customer identity can be the *referred* party at most once, ever.
  unique (referred_customer_key)
);
create index referrals_referrer_idx on public.referrals(referrer_customer_key);

-- Reward units: 1 unit = 5 percentage points. EARN/REDEEM/REVERSAL/ADMIN_ADJUSTMENT form a full
-- audit ledger; the balance for a customer is the sum of reward_units for their customer_key.
create table public.referral_reward_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_key text not null references public.referral_identities(customer_key),
  type text not null check (type in ('EARN', 'REDEEM', 'REVERSAL', 'ADMIN_ADJUSTMENT')),
  reward_units integer not null check (reward_units <> 0),
  referral_id uuid references public.referrals(id),
  booking_id uuid references public.bookings(id),
  note text check (note is null or length(note) <= 500),
  created_by text,
  created_at timestamptz not null default now()
);
create index referral_reward_transactions_customer_idx on public.referral_reward_transactions(customer_key);
-- Idempotent reward issuance: at most one EARN and one REVERSAL per referral, one REDEEM per booking.
create unique index referral_reward_transactions_earn_once_idx on public.referral_reward_transactions(referral_id) where type = 'EARN';
create unique index referral_reward_transactions_reversal_once_idx on public.referral_reward_transactions(referral_id) where type = 'REVERSAL';
create unique index referral_reward_transactions_redeem_once_idx on public.referral_reward_transactions(booking_id) where type = 'REDEEM';

alter table public.referral_identities enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_reward_transactions enable row level security;
revoke all on public.referral_identities from public, anon, authenticated;
revoke all on public.referrals from public, anon, authenticated;
revoke all on public.referral_reward_transactions from public, anon, authenticated;
grant all on public.referral_identities to service_role;
grant all on public.referrals to service_role;
grant all on public.referral_reward_transactions to service_role;

-- Historical bookings have no referral data; new columns are nullable/zero-default.
alter table public.bookings add column referral_code text;
alter table public.bookings add column referrer_customer_key text;
alter table public.bookings add column referral_discount_percent numeric(5,2) not null default 0 check (referral_discount_percent >= 0 and referral_discount_percent <= 20);
alter table public.bookings add column referral_discount_amount numeric(12,2) not null default 0 check (referral_discount_amount >= 0);
alter table public.bookings add column referral_reward_units_redeemed integer not null default 0 check (referral_reward_units_redeemed >= 0);

create or replace function public.referral_customer_key(p_email text, p_phone text)
returns text language sql immutable set search_path = '' as $$
  select coalesce(nullif(lower(trim(p_email)), ''), nullif(regexp_replace(p_phone, '\D', '', 'g'), ''));
$$;

create or replace function public.referral_reward_balance(p_customer_key text)
returns integer language sql stable security invoker set search_path = '' as $$
  select coalesce(sum(reward_units), 0)::integer from public.referral_reward_transactions where customer_key = p_customer_key;
$$;
revoke all on function public.referral_reward_balance(text) from public, anon, authenticated;
grant execute on function public.referral_reward_balance(text) to service_role;

-- Extends the reserve_booking_with_pricing chain with referral attribution, the 5% first-eligible-
-- booking discount, and safe redemption of previously earned reward units. Referral and promo
-- discounts never stack: whichever is worth more to the customer is the one actually applied.
create function public.reserve_booking_with_referral(
  p_pricing_snapshot jsonb,
  p_idempotency_key uuid, p_request_hash text, p_reference text,
  p_type text, p_customer_name text, p_customer_email text, p_phone text,
  p_tour_name text, p_tour_slug text, p_date date, p_start_time time,
  p_guests integer, p_adults integer, p_youth integer, p_infants integer,
  p_hotel text, p_notes text, p_amount numeric, p_currency text, p_locale text,
  p_items jsonb default null,
  p_promo_code text default null,
  p_referral_code text default null,
  p_redeem_units integer default 0
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  ledger public.booking_submission_idempotency;
  saved public.bookings;
  result jsonb;
  own_identity public.referral_identities;
  referrer public.referral_identities;
  promo public.promo_codes;
  new_referral public.referrals;
  v_customer_key text := public.referral_customer_key(p_customer_email, p_phone);
  v_promo_code text := nullif(upper(trim(p_promo_code)), '');
  v_referral_code text := nullif(upper(trim(p_referral_code)), '');
  promo_discount numeric := 0;
  first_booking_discount numeric := 0;
  redeem_units integer := 0;
  redeem_discount numeric := 0;
  referral_total_percent numeric := 0;
  referral_total_discount numeric := 0;
  final_discount numeric := 0;
  chosen text := 'none';
  is_first_booking boolean;
  balance integer := 0;
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

  if v_customer_key is null then
    raise exception 'A valid email or phone is required.';
  end if;

  -- Ensure the booking customer has their own referral identity, and lock that row for
  -- the rest of this transaction: this is what serializes concurrent redemption attempts
  -- for the same customer and prevents double-spending reward units.
  loop
    begin
      insert into public.referral_identities(customer_key, referral_code, customer_name, customer_email, phone)
      values (v_customer_key, 'DRS-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)),
        nullif(p_customer_name, ''), nullif(p_customer_email, ''), nullif(p_phone, ''))
      on conflict (customer_key) do nothing;
      exit;
    exception when unique_violation then
      -- referral_code collision (extremely unlikely); loop retries with a fresh random code.
    end;
  end loop;
  -- The UPDATE below acquires the row lock (no separate SELECT ... FOR UPDATE needed).
  update public.referral_identities set
    customer_name = coalesce(nullif(p_customer_name, ''), customer_name),
    customer_email = coalesce(nullif(p_customer_email, ''), customer_email),
    phone = coalesce(nullif(p_phone, ''), phone),
    updated_at = now()
    where customer_key = v_customer_key returning * into own_identity;

  select not exists (
    select 1 from public.bookings b
    where b.status <> 'cancelled'
      and public.referral_customer_key(b.customer_email, b.phone) = v_customer_key
  ) into is_first_booking;

  -- New-customer 5% discount: only for a genuinely first, non-self referral, once ever.
  if v_referral_code is not null and is_first_booking and not exists (
    select 1 from public.referrals r where r.referred_customer_key = v_customer_key
  ) then
    select * into referrer from public.referral_identities where referral_code = v_referral_code for update;
    if found and referrer.customer_key <> v_customer_key then
      first_booking_discount := round(p_amount * 0.05, 2);
    else
      -- Self-referral or unknown code: no discount, no attribution.
      referrer := null;
    end if;
  end if;

  -- Redemption of previously earned reward units (1 unit = 5%, capped at 15% per booking).
  if p_redeem_units is not null and p_redeem_units > 0 then
    balance := public.referral_reward_balance(v_customer_key);
    redeem_units := least(p_redeem_units, balance, 3);
    if redeem_units > 0 then
      redeem_discount := round(p_amount * (redeem_units * 5) / 100, 2);
    end if;
  end if;

  referral_total_percent := (case when first_booking_discount > 0 then 5 else 0 end) + redeem_units * 5;
  referral_total_discount := least(p_amount, first_booking_discount + redeem_discount);

  if v_promo_code is not null then
    select * into promo from public.promo_codes where promo_codes.code = v_promo_code for update;
    if found and promo.active and p_type = 'tour'
      and (promo.starts_at is null or promo.starts_at <= now())
      and (promo.expires_at is null or promo.expires_at > now())
      and (promo.max_redemptions is null or promo.redeemed_count < promo.max_redemptions)
      and (promo.currency is null or promo.currency = upper(p_currency))
      and p_amount > 0 and p_amount >= promo.minimum_amount
      and (promo.tour_slug is null or (
        case when p_tour_slug = 'multi-trip' then
          p_items is not null and jsonb_array_length(p_items) > 0 and not exists (
            select 1 from jsonb_array_elements(p_items) item where item->>'tour_slug' is distinct from promo.tour_slug
          )
        else p_tour_slug = promo.tour_slug end
      )) then
      promo_discount := least(p_amount, round(case when promo.discount_type = 'percent' then p_amount * promo.discount_value / 100 else promo.discount_value end, 2));
    end if;
  end if;

  if promo_discount > referral_total_discount then
    chosen := 'promo';
    final_discount := promo_discount;
  elsif referral_total_discount > 0 then
    chosen := 'referral';
    final_discount := referral_total_discount;
  end if;

  select trip_id into reference_id from public.content_items where content_type = 'tour' and locale = 'en' and slug = p_tour_slug;
  result := public.reserve_booking_idempotent(
    p_idempotency_key, p_request_hash, p_reference, p_type, p_customer_name, p_customer_email, p_phone,
    p_tour_name, p_tour_slug, p_date, p_start_time, p_guests, p_adults, p_youth, p_infants, p_hotel, p_notes,
    p_amount - final_discount, p_currency, p_locale, p_items
  );
  if (result->>'replayed')::boolean then return result; end if;

  update public.bookings set
    subtotal = p_amount,
    trip_id = reference_id,
    promo_code = case when chosen = 'promo' then v_promo_code else null end,
    discount_amount = final_discount,
    referral_code = v_referral_code,
    referrer_customer_key = referrer.customer_key,
    referral_discount_percent = case when chosen = 'referral' then referral_total_percent else 0 end,
    referral_discount_amount = case when chosen = 'referral' then referral_total_discount else 0 end,
    referral_reward_units_redeemed = case when chosen = 'referral' then redeem_units else 0 end
    where id = (result->'booking'->>'id')::uuid returning * into saved;

  if chosen = 'promo' then
    insert into public.promo_redemptions(booking_id, promo_id, discount_amount) values (saved.id, promo.id, promo_discount);
    update public.promo_codes set redeemed_count = redeemed_count + 1 where id = promo.id;
  end if;

  -- Record referral attribution whenever a valid, eligible referral is present, even if the
  -- promo code ultimately won the discount — this is what lets the referrer earn later.
  if referrer.customer_key is not null and first_booking_discount > 0 then
    insert into public.referrals(referral_code, referrer_customer_key, referred_customer_key, referred_booking_id, discount_percent, discount_amount)
    values (v_referral_code, referrer.customer_key, v_customer_key, saved.id, case when chosen = 'referral' then 5 else 0 end, case when chosen = 'referral' then first_booking_discount else 0 end)
    returning * into new_referral;
  end if;

  if chosen = 'referral' and redeem_units > 0 then
    insert into public.referral_reward_transactions(customer_key, type, reward_units, booking_id, note)
    values (v_customer_key, 'REDEEM', -redeem_units, saved.id, 'Redeemed at checkout');
  end if;

  -- Same tamper-evidence check as reserve_booking_with_pricing: the snapshot's line items
  -- must reconcile against the pre-discount subtotal (p_amount), never against current live prices.
  if p_pricing_snapshot is null
    or (p_pricing_snapshot->>'version') is distinct from '1'
    or (p_pricing_snapshot->>'currency') is distinct from upper(p_currency)
    or (p_pricing_snapshot->>'subtotal')::numeric is distinct from p_amount
    or jsonb_typeof(p_pricing_snapshot->'trips') is distinct from 'array'
    or jsonb_array_length(p_pricing_snapshot->'trips') = 0 then
    raise exception 'Invalid booking pricing snapshot.';
  end if;
  if abs((select coalesce(sum((line->>'total')::numeric), 0)
    from jsonb_array_elements(p_pricing_snapshot->'trips') trip, jsonb_array_elements(trip->'lines') line) - p_amount) > 0.01 then
    raise exception 'Booking pricing snapshot does not reconcile.';
  end if;
  update public.bookings set pricing_snapshot = p_pricing_snapshot where id = saved.id returning * into saved;

  return jsonb_build_object('booking', to_jsonb(saved), 'replayed', false);
end $$;
revoke all on function public.reserve_booking_with_referral(jsonb,uuid,text,text,text,text,text,text,text,text,date,time,integer,integer,integer,integer,text,text,numeric,text,text,jsonb,text,text,integer) from public, anon, authenticated;
grant execute on function public.reserve_booking_with_referral(jsonb,uuid,text,text,text,text,text,text,text,text,date,time,integer,integer,integer,integer,text,text,numeric,text,text,jsonb,text,text,integer) to service_role;

-- Idempotently earns/reverses the referrer's reward when the referred booking's status changes.
-- Cancelled/no-show bookings never earn; only a transition into 'completed' qualifies a pending
-- referral, and a later transition into 'cancelled' from an already-qualified referral reverses it.
create function public.sync_referral_reward_for_booking(p_booking_id uuid, p_new_status text)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  referral public.referrals;
begin
  select * into referral from public.referrals where referred_booking_id = p_booking_id for update;
  if not found then return; end if;

  if p_new_status = 'completed' and referral.status = 'pending' then
    insert into public.referral_reward_transactions(customer_key, type, reward_units, referral_id, booking_id, note)
    values (referral.referrer_customer_key, 'EARN', 1, referral.id, p_booking_id, 'Referral qualified')
    on conflict do nothing;
    update public.referrals set status = 'qualified', qualified_at = now() where id = referral.id;
  elsif p_new_status = 'cancelled' and referral.status = 'qualified' then
    insert into public.referral_reward_transactions(customer_key, type, reward_units, referral_id, booking_id, note)
    values (referral.referrer_customer_key, 'REVERSAL', -1, referral.id, p_booking_id, 'Referred booking cancelled after reward was earned')
    on conflict do nothing;
    update public.referrals set status = 'reversed', reversed_at = now() where id = referral.id;
  elsif p_new_status = 'cancelled' and referral.status = 'pending' then
    update public.referrals set status = 'cancelled' where id = referral.id;
  end if;
end $$;
-- Called from the admin booking-status routes using the signed-in staff member's session
-- (not the service-role client), matching record_admin_audit's grant — access is controlled
-- by hasLivePermission("bookings") in the calling API route, same as every other write there.
revoke all on function public.sync_referral_reward_for_booking(uuid, text) from public, anon;
grant execute on function public.sync_referral_reward_for_booking(uuid, text) to authenticated, service_role;

-- Short-lived, single-use verification codes so a returning customer can prove ownership of an
-- email/phone before their accumulated referral balance is exposed or redeemed. Reuses the
-- existing email/WhatsApp delivery channels; no new external OTP vendor.
create table public.referral_verification_codes (
  id uuid primary key default gen_random_uuid(),
  customer_key text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempts integer not null default 0 check (attempts >= 0),
  created_at timestamptz not null default now()
);
create index referral_verification_codes_customer_idx on public.referral_verification_codes(customer_key, expires_at);
alter table public.referral_verification_codes enable row level security;
revoke all on public.referral_verification_codes from public, anon, authenticated;
grant all on public.referral_verification_codes to service_role;
