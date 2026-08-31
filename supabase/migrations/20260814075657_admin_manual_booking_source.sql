alter table public.bookings
  add column if not exists booking_source text not null default 'website';

alter table public.bookings
  drop constraint if exists bookings_booking_source_check;

alter table public.bookings
  add constraint bookings_booking_source_check
  check (booking_source in ('website', 'manual'));

create index if not exists bookings_booking_source_idx
  on public.bookings (booking_source, created_at desc);;
