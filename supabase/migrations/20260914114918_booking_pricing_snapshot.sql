-- Additive rollout: older application versions continue using the existing RPC.
alter table public.bookings add column pricing_snapshot jsonb;

create function public.reserve_booking_with_pricing(
  p_pricing_snapshot jsonb,
  p_idempotency_key uuid, p_request_hash text, p_reference text,
  p_type text, p_customer_name text, p_customer_email text, p_phone text,
  p_tour_name text, p_tour_slug text, p_date date, p_start_time time,
  p_guests integer, p_adults integer, p_youth integer, p_infants integer,
  p_hotel text, p_notes text, p_amount numeric, p_currency text, p_locale text,
  p_items jsonb default null, p_promo_code text default null
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  result jsonb;
  saved public.bookings;
  line_sum numeric;
begin
  result := public.reserve_booking_with_promo(
    p_idempotency_key,p_request_hash,p_reference,p_type,p_customer_name,p_customer_email,p_phone,
    p_tour_name,p_tour_slug,p_date,p_start_time,p_guests,p_adults,p_youth,p_infants,p_hotel,p_notes,
    p_amount,p_currency,p_locale,p_items,p_promo_code
  );
  -- Never replace the original snapshot on a retry (including pre-migration bookings).
  if (result->>'replayed')::boolean then return result; end if;
  if p_pricing_snapshot is null
    or (p_pricing_snapshot->>'version') is distinct from '1'
    or (p_pricing_snapshot->>'currency') is distinct from upper(p_currency)
    or (p_pricing_snapshot->>'subtotal')::numeric is distinct from p_amount
    or jsonb_typeof(p_pricing_snapshot->'trips') is distinct from 'array'
    or jsonb_array_length(p_pricing_snapshot->'trips') = 0 then
    raise exception 'Invalid booking pricing snapshot.';
  end if;
  select coalesce(sum((line->>'total')::numeric),0) into line_sum
    from jsonb_array_elements(p_pricing_snapshot->'trips') trip,
      jsonb_array_elements(trip->'lines') line;
  if abs(line_sum-p_amount) > 0.01 then raise exception 'Booking pricing snapshot does not reconcile.'; end if;
  update public.bookings set pricing_snapshot=p_pricing_snapshot
    where id=(result->'booking'->>'id')::uuid returning * into saved;
  return jsonb_build_object('booking',to_jsonb(saved),'replayed',false);
end $$;
revoke all on function public.reserve_booking_with_pricing(jsonb,uuid,text,text,text,text,text,text,text,text,date,time,integer,integer,integer,integer,text,text,numeric,text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.reserve_booking_with_pricing(jsonb,uuid,text,text,text,text,text,text,text,text,date,time,integer,integer,integer,integer,text,text,numeric,text,text,jsonb,text) to service_role;
