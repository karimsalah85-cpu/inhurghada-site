-- unique (tour_slug, service_date, start_time) does not stop two whole-day rows
-- (start_time is null) for the same tour and date, because NULLs are distinct.
-- reserve_booking picks one row with limit 1, so a duplicate would split
-- capacity and let a departure oversell.
create unique index if not exists tour_availability_whole_day_unique
  on public.tour_availability (tour_slug, service_date)
  where start_time is null;
