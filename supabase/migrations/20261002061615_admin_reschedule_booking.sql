-- Staff can move a booking to another date (and, for timed services, another
-- time). One trip of a multi-trip booking is moved with p_trip_index.
--
-- Everything that derives from the date moves in the same transaction:
--   * reserved places leave the old availability slot and are checked against
--     and added to the new one (cancelled bookings hold no places),
--   * the pricing snapshot and the generated notes of a multi-trip booking,
--   * booking_financial_lines.trip_date, through the existing bookings trigger,
--   * queued pickup reminders, so the reminder is sent again for the new date.

create or replace function public.admin_reschedule_booking(
  p_booking_id uuid,
  p_date date,
  p_start_time time default null,
  p_trip_index integer default null
) returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare
  b public.bookings;
  slot public.tour_availability;
  res record;
  nl constant text := chr(10);
  v_time time;
  v_new_date date;
  v_old_trip_date date;
  v_snapshot jsonb;
  v_notes text;
  v_prefix text;
  v_pattern text;
  v_match text[];
  v_trip jsonb;
  v_trip_count integer := 0;
  v_slug text;
  v_places integer;
  v_slot_time time;
  v_has_reservation boolean := false;
begin
  if not public.admin_has_permission('bookings') then
    raise exception using errcode = '42501', message = 'Booking-editing permission required.';
  end if;
  if p_date is null or p_date < date '2020-01-01' or p_date > current_date + 1095 then
    raise exception using errcode = '22023', message = 'Choose a valid date.';
  end if;

  select * into b from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Booking not found.';
  end if;

  v_snapshot := b.pricing_snapshot;
  v_notes := b.notes;

  if b.tour_slug is distinct from 'multi-trip' then
    if p_trip_index is not null and p_trip_index <> 0 then
      raise exception using errcode = '22023', message = 'This booking has a single trip.';
    end if;
    v_time := coalesce(p_start_time, b.start_time);
    v_new_date := p_date;
    if b.date is not distinct from v_new_date and b.start_time is not distinct from v_time then
      return b;
    end if;

    if b.status <> 'cancelled' and b.tour_slug is not null and coalesce(b.guests, 0) > 0 then
      if b.date is not null then
        select * into slot from public.tour_availability
          where tour_slug = b.tour_slug and service_date = b.date
            and (start_time is null or b.start_time is null or start_time = b.start_time)
          order by (start_time = b.start_time) desc nulls last limit 1 for update;
        if found then
          update public.tour_availability set reserved = greatest(0, reserved - b.guests), updated_at = now() where id = slot.id;
        end if;
      end if;
      select * into slot from public.tour_availability
        where tour_slug = b.tour_slug and service_date = v_new_date
          and (start_time is null or v_time is null or start_time = v_time)
        order by (start_time = v_time) desc nulls last limit 1 for update;
      if found then
        if slot.blocked then
          raise exception using errcode = 'P0001', message = format('%s is blocked for this trip. Unblock it in availability first.', v_new_date);
        end if;
        if slot.capacity is not null and slot.reserved + b.guests > slot.capacity then
          raise exception using errcode = 'P0001', message = format('Only %s places remain on %s; this booking needs %s.', greatest(slot.capacity - slot.reserved, 0), v_new_date, b.guests);
        end if;
        update public.tour_availability set reserved = reserved + b.guests, updated_at = now() where id = slot.id;
      end if;
    end if;
  else
    -- Multi-trip: one trip moves; the booking date follows the earliest trip.
    v_time := b.start_time;
    if jsonb_typeof(v_snapshot -> 'trips') = 'array' then
      v_trip_count := jsonb_array_length(v_snapshot -> 'trips');
    end if;
    if p_trip_index is null then
      if v_trip_count > 1 then
        raise exception using errcode = '22023', message = 'Choose which trip to move.';
      end if;
      p_trip_index := 0;
    end if;
    if p_trip_index < 0 or (v_trip_count > 0 and p_trip_index >= v_trip_count) then
      raise exception using errcode = '22023', message = 'Trip not found on this booking.';
    end if;

    -- The generated notes list each trip as "N. Name / Date: YYYY-MM-DD / …"
    -- ahead of the customer's own note, which is never rewritten.
    v_prefix := split_part(coalesce(b.notes, ''), 'Customer note:', 1);
    v_pattern := '(^|' || nl || nl || ')(' || (p_trip_index + 1)::text || '\. [^' || nl || ']*' || nl || 'Date: )(\d{4}-\d{2}-\d{2})';
    v_match := regexp_match(v_prefix, v_pattern);

    if v_trip_count > 0 then
      v_trip := v_snapshot -> 'trips' -> p_trip_index;
      if coalesce(v_trip ->> 'date', '') ~ '^\d{4}-\d{2}-\d{2}$' then
        v_old_trip_date := (v_trip ->> 'date')::date;
      end if;
      v_snapshot := jsonb_set(v_snapshot, array['trips', p_trip_index::text, 'date'], to_jsonb(p_date::text), true);
    elsif v_match is null and p_trip_index > 0 then
      raise exception using errcode = '22023', message = 'Trip not found on this booking.';
    end if;
    if v_match is not null then
      v_old_trip_date := coalesce(v_old_trip_date, v_match[3]::date);
      v_notes := regexp_replace(v_prefix, v_pattern, '\1\2' || p_date::text) || substr(b.notes, length(v_prefix) + 1);
      v_prefix := split_part(v_notes, 'Customer note:', 1);
    end if;
    v_old_trip_date := coalesce(v_old_trip_date, b.date);

    if v_trip_count > 0 then
      select min((t ->> 'date')::date) into v_new_date
        from jsonb_array_elements(v_snapshot -> 'trips') t where coalesce(t ->> 'date', '') ~ '^\d{4}-\d{2}-\d{2}$';
    else
      select min(m[1]::date) into v_new_date
        from regexp_matches(v_prefix, '(?:^|' || nl || ')\d+\. [^' || nl || ']*' || nl || 'Date: (\d{4}-\d{2}-\d{2})', 'g') m;
    end if;
    v_new_date := coalesce(v_new_date, p_date);

    if v_old_trip_date is not distinct from p_date and b.date is not distinct from v_new_date then
      return b;
    end if;

    if b.status <> 'cancelled' and v_old_trip_date is distinct from p_date then
      select d.tour_slug into v_slug from public.finance_tour_dimensions d
        where d.tour_name = v_trip ->> 'name' order by d.tour_slug limit 1;
      v_places := nullif(coalesce((v_trip ->> 'guests')::integer, 0), 0);
      v_slot_time := case when coalesce(v_trip ->> 'time', '') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then (v_trip ->> 'time')::time end;

      select r.id, r.places, a.id as availability_id, a.tour_slug, a.start_time into res
        from public.booking_capacity_reservations r
        join public.tour_availability a on a.id = r.availability_id
        where r.booking_id = b.id and r.released_at is null and a.service_date = v_old_trip_date
        order by (a.tour_slug = v_slug) desc nulls last, r.created_at limit 1
        for update of r, a;
      if found then
        v_has_reservation := true;
        v_slug := res.tour_slug;
        v_places := res.places;
        v_slot_time := res.start_time;
        update public.tour_availability set reserved = greatest(0, reserved - res.places), updated_at = now() where id = res.availability_id;
      end if;

      if v_slug is not null and v_places is not null then
        select * into slot from public.tour_availability
          where tour_slug = v_slug and service_date = p_date
            and (start_time is null or v_slot_time is null or start_time = v_slot_time)
          order by (start_time = v_slot_time) desc nulls last limit 1 for update;
        if found then
          if slot.blocked then
            raise exception using errcode = 'P0001', message = format('%s is blocked for this trip. Unblock it in availability first.', p_date);
          end if;
          if slot.capacity is not null and slot.reserved + v_places > slot.capacity then
            raise exception using errcode = 'P0001', message = format('Only %s places remain on %s; this trip needs %s.', greatest(slot.capacity - slot.reserved, 0), p_date, v_places);
          end if;
          update public.tour_availability set reserved = reserved + v_places, updated_at = now() where id = slot.id;
          if v_has_reservation then
            delete from public.booking_capacity_reservations where id = res.id;
          end if;
          insert into public.booking_capacity_reservations (booking_id, availability_id, places)
            values (b.id, slot.id, v_places)
            on conflict (booking_id, availability_id)
            do update set places = public.booking_capacity_reservations.places + excluded.places, released_at = null;
        elsif v_has_reservation then
          -- The new date has no capacity limit, so nothing is held any more.
          delete from public.booking_capacity_reservations where id = res.id;
        end if;
      end if;
    end if;
  end if;

  if b.date is distinct from v_new_date then
    delete from public.communication_queue q using public.communication_templates t
      where q.booking_id = b.id and q.template_id = t.id and t.event_key = 'pickup_reminder';
  end if;

  update public.bookings
    set date = v_new_date, start_time = v_time, pricing_snapshot = v_snapshot, notes = v_notes, updated_at = now()
    where id = b.id
    returning * into b;
  return b;
end $$;

revoke all on function public.admin_reschedule_booking(uuid, date, time, integer) from public, anon;
grant execute on function public.admin_reschedule_booking(uuid, date, time, integer) to authenticated;
