-- Acquisition-only referrals. Additive: historical ledger and discounts remain immutable.
-- All money-affecting writers acquire one transaction lock BEFORE booking row locks.
-- At this site's volume this deliberately favors correctness over parallel write throughput.
create schema if not exists referral_private;
revoke all on schema referral_private from public, anon, authenticated;
grant usage on schema referral_private to service_role;

alter table public.referral_identities drop constraint referral_identities_referral_code_check;
alter table public.referral_identities add constraint referral_identities_referral_code_check check (referral_code ~ '^DRS-([A-Z0-9]{6}|[A-F0-9]{32})$');
alter table public.bookings add column referral_exclusion_reason text check (referral_exclusion_reason in ('test','fraud','no_show','duplicate'));
alter table public.bookings add column referral_qualified_at timestamptz;
alter table public.referrals drop constraint referrals_status_check;
alter table public.referrals add constraint referrals_status_check check (status in ('pending','pending_review','qualified','reversed','cancelled','rejected'));
alter table public.referrals add column review_reasons text[] not null default '{}';
alter table public.referrals add column reviewed_at timestamptz;
alter table public.referrals add column reviewed_by text;
alter table public.referrals add column rejection_reason text;
alter table public.referral_reward_transactions drop constraint referral_reward_transactions_type_check;
alter table public.referral_reward_transactions add constraint referral_reward_transactions_type_check check (type in ('EARN','REDEEM','REVERSAL','RESTORE','ADMIN_ADJUSTMENT'));
create unique index referral_reward_restore_once on public.referral_reward_transactions(booking_id) where type='RESTORE';

create table public.referral_booking_participants (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete restrict,
 customer_key text, email text, phone text, created_at timestamptz not null default now(),
 check (coalesce(nullif(trim(customer_key),''),nullif(trim(email),''),nullif(trim(phone),'')) is not null),
 unique(booking_id,customer_key)
);
create table public.referral_review_audit (
 id uuid primary key default gen_random_uuid(), referral_id uuid not null references public.referrals(id),
 decision text not null, reason text not null, actor text not null, created_at timestamptz not null default now()
);
create table public.referral_attempts (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id),
 referral_code text, outcome text not null, reasons text[] not null default '{}', created_at timestamptz not null default now()
);
create table public.referral_notification_events (
 id uuid primary key default gen_random_uuid(), customer_key text not null references public.referral_identities(customer_key),
 event_type text not null check (event_type in ('activated','reward_earned','trip_completed')), booking_id uuid references public.bookings(id),
 referral_id uuid references public.referrals(id), payload jsonb not null default '{}',
 created_at timestamptz not null default now(), processing_at timestamptz, sent_at timestamptz,
 attempts integer not null default 0, last_error text, discarded_at timestamptz
);
create unique index referral_trip_completed_once on public.referral_notification_events(booking_id) where event_type='trip_completed';
create unique index referral_activation_once on public.referral_notification_events(customer_key) where event_type='activated';
create unique index referral_earned_notification_once on public.referral_notification_events(referral_id) where event_type='reward_earned';
alter table public.referral_booking_participants enable row level security;
alter table public.referral_review_audit enable row level security;
alter table public.referral_attempts enable row level security;
alter table public.referral_notification_events enable row level security;
revoke all on public.referral_booking_participants,public.referral_review_audit,public.referral_attempts,public.referral_notification_events from public,anon,authenticated;
grant all on public.referral_booking_participants,public.referral_review_audit,public.referral_attempts,public.referral_notification_events to service_role;

create function public.normalize_referral_email(p_value text) returns text language sql immutable set search_path='' as $$
 select nullif(lower(trim(p_value)),''); $$;
create function public.normalize_referral_phone(p_value text) returns text language sql immutable set search_path='' as $$
 select nullif(regexp_replace(regexp_replace(p_value,'[^0-9]','','g'),'^00',''),''); $$;
-- Keep existing reward keys stable: phone normalization here is for comparison only.
create function referral_private.contacts_match(a_email text,a_phone text,b_email text,b_phone text) returns boolean language sql immutable set search_path='' as $$
 select coalesce(public.normalize_referral_email(a_email)=public.normalize_referral_email(b_email),false)
 or coalesce(public.normalize_referral_phone(a_phone)=public.normalize_referral_phone(b_phone),false); $$;

create function referral_private.lock_writes() returns trigger language plpgsql security definer set search_path='' as $$
begin perform pg_catalog.pg_advisory_xact_lock(174839201,5); return null; end $$;
revoke all on function referral_private.lock_writes() from public,anon,authenticated;
create trigger referral_bookings_write_lock before insert or update or delete on public.bookings for each statement execute function referral_private.lock_writes();
create trigger referral_ledger_write_lock before insert or update or delete on public.referral_reward_transactions for each statement execute function referral_private.lock_writes();
create trigger referral_participant_write_lock before insert or update or delete on public.referral_booking_participants for each statement execute function referral_private.lock_writes();

-- Every historical paid completed booking is genuine only to the extent of the existing
-- authoritative statuses. Operators can exclude test/fraud/duplicate/no-show rows explicitly.
update public.bookings set referral_qualified_at=coalesce(updated_at,created_at)
 where status='completed' and payment_status='paid' and amount>0;
create function referral_private.is_qualified(p_key text,p_before timestamptz default now()) returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from public.bookings b where public.referral_customer_key(b.customer_email,b.phone)=p_key
 and b.status='completed' and b.payment_status='paid' and b.amount>0 and b.referral_exclusion_reason is null
 and b.referral_qualified_at is not null and b.referral_qualified_at<=p_before); $$;

-- Unverified contact entry must never rewrite the delivery address or transfer a balance.
create function referral_private.ensure_identity(p_key text) returns void language plpgsql set search_path='' as $$
declare b public.bookings;
begin
 if exists(select 1 from public.referral_identities where customer_key=p_key) then return; end if;
 select * into b from public.bookings where public.referral_customer_key(customer_email,phone)=p_key order by created_at,id limit 1;
 if not found then return; end if;
 insert into public.referral_identities(customer_key,referral_code,customer_name,customer_email,phone)
 values(p_key,'DRS-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)||substr(replace(gen_random_uuid()::text,'-',''),21,12)||substr(replace(gen_random_uuid()::text,'-',''),1,8)),b.customer_name,b.customer_email,b.phone)
 on conflict(customer_key) do nothing;
end $$;

create function public.referral_account(p_customer_key text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare qualified boolean; code text;
begin
 perform pg_catalog.pg_advisory_xact_lock(174839201,5);
 perform referral_private.ensure_identity(p_customer_key);
 qualified:=referral_private.is_qualified(p_customer_key);
 select referral_code into code from public.referral_identities where customer_key=p_customer_key;
 return jsonb_build_object('customer_key',p_customer_key,'qualified',qualified,'referral_code',case when qualified then code else null end,
 'balance_units',greatest(0,public.referral_reward_balance(p_customer_key)),
 'qualified_referrals',(select count(*) from public.referrals where referrer_customer_key=p_customer_key and status='qualified'),
 'pending_referrals',(select count(*) from public.referrals where referrer_customer_key=p_customer_key and status in ('pending','pending_review')));
end $$;
revoke all on function public.referral_account(text) from public,anon,authenticated;
grant execute on function public.referral_account(text) to service_role;

create function public.consume_referral_otp(p_customer_key text,p_code_hash text) returns boolean language plpgsql security invoker set search_path='' as $$
declare c public.referral_verification_codes;
begin
 perform pg_catalog.pg_advisory_xact_lock(hashtextextended('referral-otp:'||p_customer_key,0));
 select * into c from public.referral_verification_codes where customer_key=p_customer_key order by created_at desc,id desc limit 1 for update;
 if not found or c.consumed_at is not null or c.expires_at<=now() or c.attempts>=5 then return false; end if;
 update public.referral_verification_codes set attempts=attempts+1,consumed_at=case when code_hash=p_code_hash then now() else null end where id=c.id;
 return c.code_hash=p_code_hash;
end $$;
revoke all on function public.consume_referral_otp(text,text) from public,anon,authenticated;
grant execute on function public.consume_referral_otp(text,text) to service_role;

-- Calls cannot spoof booking state. Only private trigger/review processing owns issuance.
revoke all on function public.sync_referral_reward_for_booking(uuid,text) from public,anon,authenticated,service_role;
create or replace function public.sync_referral_reward_for_booking(p_booking_id uuid,p_new_status text) returns void language plpgsql set search_path='' as $$
begin raise exception 'Referral rewards are synchronized by authoritative booking lifecycle triggers.'; end $$;

create function referral_private.sync_booking(p_booking_id uuid) returns void language plpgsql set search_path='' as $$
declare b public.bookings; r public.referrals; k text; units integer;
begin
 perform pg_catalog.pg_advisory_xact_lock(174839201,5);
 select * into b from public.bookings where id=p_booking_id;
 if not found then return; end if;
 k:=public.referral_customer_key(b.customer_email,b.phone);
 perform referral_private.ensure_identity(k);
 if b.status='completed' and b.referral_exclusion_reason is null then
  insert into public.referral_notification_events(customer_key,event_type,booking_id,payload)
  values(k,'trip_completed',b.id,jsonb_build_object('locale',b.locale)) on conflict do nothing;
 end if;
 if b.status='completed' and b.payment_status='paid' and b.amount>0 and b.referral_exclusion_reason is null then
  insert into public.referral_notification_events(customer_key,event_type,booking_id,payload)
  values(k,'activated',b.id,jsonb_build_object('locale',b.locale)) on conflict do nothing;
 end if;
 select * into r from public.referrals where referred_booking_id=b.id for update;
 if found then
  if r.status in ('pending','qualified','pending_review') and (b.status='cancelled' or b.payment_status='refunded' or b.referral_exclusion_reason is not null) then
   if r.status='qualified' then
    insert into public.referral_reward_transactions(customer_key,type,reward_units,referral_id,booking_id,note)
    values(r.referrer_customer_key,'REVERSAL',-1,r.id,b.id,'Qualifying booking cancelled, refunded or excluded') on conflict do nothing;
   end if;
   update public.referrals set status=case when r.status='qualified' then 'reversed' else 'cancelled' end,
    reversed_at=case when r.status='qualified' then now() else null end where id=r.id;
  elsif r.status='qualified' and (b.status<>'completed' or b.payment_status<>'paid' or b.amount<=0) then
   insert into public.referral_reward_transactions(customer_key,type,reward_units,referral_id,booking_id,note)
   values(r.referrer_customer_key,'REVERSAL',-1,r.id,b.id,'Qualifying lifecycle state withdrawn') on conflict do nothing;
   update public.referrals set status='reversed',reversed_at=now() where id=r.id;
  elsif r.status='pending' and b.status='completed' and b.payment_status='paid' and b.amount>0
   and b.referral_exclusion_reason is null and referral_private.is_qualified(r.referrer_customer_key,r.created_at) then
   insert into public.referral_reward_transactions(customer_key,type,reward_units,referral_id,booking_id,note)
   values(r.referrer_customer_key,'EARN',1,r.id,b.id,'Paid completed referred booking') on conflict do nothing;
   update public.referrals set status='qualified',qualified_at=now() where id=r.id;
   insert into public.referral_notification_events(customer_key,event_type,booking_id,referral_id,payload)
   values(r.referrer_customer_key,'reward_earned',b.id,r.id,jsonb_build_object('balance_units',public.referral_reward_balance(r.referrer_customer_key))) on conflict do nothing;
  end if;
 end if;
 if b.status='cancelled' or b.payment_status='refunded' then
  select -reward_units into units from public.referral_reward_transactions where booking_id=b.id and type='REDEEM';
  if units>0 then
   insert into public.referral_reward_transactions(customer_key,type,reward_units,booking_id,note)
   values(k,'RESTORE',units,b.id,'Unused reward redemption restored after cancellation/refund') on conflict do nothing;
  end if;
 end if;
end $$;

create function referral_private.booking_before() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='UPDATE' and exists(select 1 from public.referral_reward_transactions where booking_id=old.id and type='RESTORE')
 and new.status<>'cancelled' and new.payment_status<>'refunded' then
  raise exception 'A cancelled/refunded reward booking must be rebooked to redeem rewards again.';
 end if;
 if new.status='completed' and new.payment_status='paid' and new.amount>0 and new.referral_exclusion_reason is null then
  new.referral_qualified_at:=coalesce(case when TG_OP='UPDATE' then old.referral_qualified_at else null end,clock_timestamp());
 else new.referral_qualified_at:=case when TG_OP='UPDATE' then old.referral_qualified_at else null end; end if;
 return new;
end $$;
create function referral_private.booking_after() returns trigger language plpgsql security definer set search_path='' as $$
begin perform referral_private.sync_booking(new.id); return new; end $$;
revoke all on function referral_private.booking_before(),referral_private.booking_after() from public,anon,authenticated;
create trigger referral_booking_qualification before insert or update on public.bookings for each row execute function referral_private.booking_before();
create trigger referral_booking_lifecycle after insert or update of status,payment_status,referral_exclusion_reason,amount on public.bookings for each row execute function referral_private.booking_after();

create function public.review_referral(p_referral_id uuid,p_decision text,p_reason text,p_actor text) returns jsonb language plpgsql set search_path='' as $$
declare r public.referrals;
begin
 perform pg_catalog.pg_advisory_xact_lock(174839201,5);
 if p_decision not in ('approve','reject') or length(trim(coalesce(p_reason,'')))<3 or nullif(trim(p_actor),'') is null then raise exception 'A decision, reason and actor are required.'; end if;
 select * into r from public.referrals where id=p_referral_id for update;
 if not found then raise exception 'Referral not found.'; end if;
 if r.status<>'pending_review' then raise exception 'Only pending review referrals can be reviewed.'; end if;
 update public.referrals set status=case when p_decision='approve' then 'pending' else 'rejected' end,
 reviewed_at=now(),reviewed_by=p_actor,rejection_reason=case when p_decision='reject' then p_reason else null end where id=r.id;
 insert into public.referral_review_audit(referral_id,decision,reason,actor) values(r.id,p_decision,p_reason,p_actor);
 perform referral_private.sync_booking(r.referred_booking_id);
 return (select to_jsonb(x) from public.referrals x where id=r.id);
end $$;
revoke all on function public.review_referral(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.review_referral(uuid,text,text,text) to service_role;

create function public.claim_referral_notifications(p_limit integer default 20) returns setof public.referral_notification_events language sql set search_path='' as $$
 update public.referral_notification_events set processing_at=now(),attempts=attempts+1
 where id in (select id from public.referral_notification_events where sent_at is null and discarded_at is null and attempts<5 and (processing_at is null or processing_at<now()-interval '15 minutes')
 order by created_at limit least(greatest(p_limit,1),50) for update skip locked) returning *; $$;
revoke all on function public.claim_referral_notifications(integer) from public,anon,authenticated;
grant execute on function public.claim_referral_notifications(integer) to service_role;

alter table public.referral_booking_participants add column created_by text;
create function referral_private.same_booking_party(p_email text,p_phone text,p_referrer text) returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from public.referral_booking_participants p join public.bookings b on b.id=p.booking_id
 where (p.customer_key=public.referral_customer_key(p_email,p_phone) or referral_private.contacts_match(p.email,p.phone,p_email,p_phone))
 and (public.referral_customer_key(b.customer_email,b.phone)=p_referrer or exists(
 select 1 from public.referral_booking_participants q join public.referral_identities ri on ri.customer_key=p_referrer
 where q.booking_id=b.id and (q.customer_key=p_referrer or referral_private.contacts_match(q.email,q.phone,ri.customer_email,ri.phone)))))
 or exists(select 1 from public.referral_booking_participants p join public.bookings b on b.id=p.booking_id
 join public.referral_identities r on r.customer_key=p_referrer
 where referral_private.contacts_match(b.customer_email,b.phone,p_email,p_phone)
 and (p.customer_key=p_referrer or referral_private.contacts_match(p.email,p.phone,r.customer_email,r.phone)));
$$;

create function referral_private.participant_after() returns trigger language plpgsql security definer set search_path='' as $$
declare r public.referrals; b public.bookings;
begin
 for r in select * from public.referrals where status in ('pending','pending_review','qualified') loop
  select * into b from public.bookings where id=r.referred_booking_id;
  if referral_private.same_booking_party(b.customer_email,b.phone,r.referrer_customer_key) then
   if r.status='qualified' then
    insert into public.referral_reward_transactions(customer_key,type,reward_units,referral_id,booking_id,note)
    values(r.referrer_customer_key,'REVERSAL',-1,r.id,b.id,'Known same-booking participant relationship') on conflict do nothing;
   end if;
   update public.referrals set status='rejected',rejection_reason='same_booking_participants',
   review_reasons=array_append(review_reasons,'same_booking_participants'),reversed_at=case when r.status='qualified' then now() else reversed_at end where id=r.id;
   insert into public.referral_review_audit(referral_id,decision,reason,actor)
   values(r.id,'reject','same_booking_participants',coalesce(new.created_by,'participant-lifecycle'));
  end if;
 end loop;
 return new;
end $$;
revoke all on function referral_private.participant_after() from public,anon,authenticated;
create trigger referral_participant_link after insert or update on public.referral_booking_participants for each row execute function referral_private.participant_after();
create or replace function public.reserve_booking_with_referral(
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
  rejection text;
  review_reasons text[] := '{}';
  cycle_found boolean;
begin
  perform pg_catalog.pg_advisory_xact_lock(174839201,5);
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

  -- Stable email-first reward ownership. Phone matches deny acquisition but never merge wallets.
  insert into public.referral_identities(customer_key,referral_code,customer_name,customer_email,phone)
  values(v_customer_key,'DRS-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)||substr(replace(gen_random_uuid()::text,'-',''),21,12)||substr(replace(gen_random_uuid()::text,'-',''),1,8)),p_customer_name,p_customer_email,p_phone)
  on conflict(customer_key) do nothing;
  select * into own_identity from public.referral_identities where customer_key=v_customer_key;
  select not exists(select 1 from public.bookings b where
    referral_private.contacts_match(b.customer_email,b.phone,p_customer_email,p_phone)
    and (b.status<>'cancelled' or b.referral_qualified_at is not null)) into is_first_booking;

  if v_referral_code is not null then
    select * into referrer from public.referral_identities where referral_code=v_referral_code;
    if not found then rejection:='unknown_code';
    elsif referrer.customer_key=v_customer_key or referral_private.contacts_match(referrer.customer_email,referrer.phone,p_customer_email,p_phone) then rejection:='self_referral';
    elsif not referral_private.is_qualified(referrer.customer_key,clock_timestamp()) then rejection:='unqualified_referrer';
    else
      with recursive descendants(k,path) as (
        select r.referred_customer_key,array[r.referrer_customer_key,r.referred_customer_key] from public.referrals r where r.referrer_customer_key=v_customer_key
        union all select r.referred_customer_key,d.path||r.referred_customer_key from public.referrals r join descendants d on r.referrer_customer_key=d.k
        where not r.referred_customer_key=any(d.path)
      ) select exists(select 1 from descendants where k=referrer.customer_key) into cycle_found;
      if cycle_found then rejection:='circular_referral';
      elsif referral_private.same_booking_party(p_customer_email,p_phone,referrer.customer_key) then rejection:='same_booking_participants';
      elsif not is_first_booking or exists(select 1 from public.referrals where referred_customer_key=v_customer_key) then rejection:='existing_customer';
      elsif p_amount<=0 then rejection:='ineligible_booking';
      else
        first_booking_discount:=round(p_amount*0.05,2);
        -- A popular tour/date alone never flags. Hotel + timing is uncertainty, not proof.
        if nullif(trim(p_hotel),'') is not null and exists(select 1 from public.bookings b
          where public.referral_customer_key(b.customer_email,b.phone)=referrer.customer_key
          and b.status<>'cancelled' and b.tour_slug=p_tour_slug and b.date=p_date
          and lower(trim(b.hotel))=lower(trim(p_hotel)) and b.created_at>now()-interval '24 hours') then
          review_reasons:=array['same_hotel_tour_date_close_booking'];
        end if;
      end if;
    end if;
    if rejection is not null then referrer:=null; end if;
  end if;

  -- Redemption of previously earned reward units (1 unit = 5%, capped at 15% per booking).
  if p_redeem_units is not null and p_redeem_units > 0 then
    balance := public.referral_reward_balance(v_customer_key);
    redeem_units := least(p_redeem_units, greatest(balance, 0), 3);
    if redeem_units > 0 then
      redeem_discount := round(p_amount * (redeem_units * 5) / 100, 2);
    end if;
  end if;

  -- Acquisition and own rewards never stack. Prefer earned rewards only when strictly better.
  if redeem_discount > first_booking_discount then first_booking_discount:=0;
  else redeem_units:=0; redeem_discount:=0; end if;
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
    referral_code = case when rejection is null then v_referral_code else null end,
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
    insert into public.referrals(referral_code, referrer_customer_key, referred_customer_key, referred_booking_id, discount_percent, discount_amount,status,review_reasons)
    values (v_referral_code, referrer.customer_key, v_customer_key, saved.id, case when chosen = 'referral' then 5 else 0 end, case when chosen = 'referral' then first_booking_discount else 0 end,case when cardinality(review_reasons)>0 then 'pending_review' else 'pending' end,review_reasons)
    returning * into new_referral;
  end if;

  if chosen = 'referral' and redeem_units > 0 then
    insert into public.referral_reward_transactions(customer_key, type, reward_units, booking_id, note)
    values (v_customer_key, 'REDEEM', -redeem_units, saved.id, 'Redeemed at checkout');
  end if;

  if v_referral_code is not null then
    insert into public.referral_attempts(booking_id,referral_code,outcome,reasons)
    values(saved.id,v_referral_code,case when rejection is not null then 'rejected' when cardinality(review_reasons)>0 then 'pending_review' else 'accepted' end,
      case when rejection is not null then array[rejection] else review_reasons end);
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


alter table public.bookings add constraint referral_total_discount_cap check (referral_discount_percent between 0 and 15) not valid;
-- New reservations enforce the cap without modifying historical booking discounts.
alter table public.bookings add constraint referral_redemption_cap check (referral_reward_units_redeemed between 0 and 3) not valid;
-- Private helpers are callable only through service-only RPCs or their internal triggers.
revoke all on all functions in schema referral_private from public,anon,authenticated;
grant execute on all functions in schema referral_private to service_role;

-- Link and sign constraints make the ledger auditable even for privileged writers.
alter table public.referral_reward_transactions add constraint referral_ledger_integrity check (
 (type='EARN' and reward_units=1 and referral_id is not null and booking_id is not null) or
 (type='REVERSAL' and reward_units=-1 and referral_id is not null and booking_id is not null) or
 (type='REDEEM' and reward_units between -3 and -1 and booking_id is not null) or
 (type='RESTORE' and reward_units between 1 and 3 and booking_id is not null) or
 (type='ADMIN_ADJUSTMENT' and nullif(trim(note),'') is not null)) not valid;
