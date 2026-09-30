-- Per-trip ticket check-ins. Each confirmation carries one signed QR code per
-- trip (see lib/ticket-token.ts); scanning it opens /ticket/<token>, where a
-- signed-in staff member can mark that trip's ticket as used. One row per
-- (booking, trip) makes a second scan show "already checked in" instead of
-- letting the same ticket board twice.
create table if not exists public.booking_ticket_checkins (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  trip_index smallint not null check (trip_index between 0 and 19),
  checked_in_at timestamptz not null default now(),
  checked_in_by text check (checked_in_by is null or length(checked_in_by) <= 320),
  unique (booking_id, trip_index)
);

alter table public.booking_ticket_checkins enable row level security;
revoke all on public.booking_ticket_checkins from public, anon, authenticated;
grant select, insert, delete on public.booking_ticket_checkins to service_role;
