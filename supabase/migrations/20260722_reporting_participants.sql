alter table public.bookings
  add column if not exists adult_count integer not null default 0 check (adult_count >= 0),
  add column if not exists child_count integer not null default 0 check (child_count >= 0),
  add column if not exists infant_count integer not null default 0 check (infant_count >= 0);

create index if not exists bookings_reporting_idx on public.bookings (date, status, tour_name);

comment on column public.bookings.guests is 'Total participants for legacy and reporting bookings.';
