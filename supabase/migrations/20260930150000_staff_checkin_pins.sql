-- Check-in PINs for external guides and drivers. They never get an admin login:
-- an admin generates a 6-digit PIN per staff member (Operations → Staff), and
-- the guide types it once on a scanned ticket page; that phone is then
-- remembered. Only a keyed hash is stored, kept apart from staff_members so the
-- generic admin CRUD and audit log never see it. Regenerating a PIN signs out
-- that guide's phones; deactivating the staff member blocks check-in at once.
create table if not exists public.staff_checkin_pins (
  staff_member_id uuid primary key references public.staff_members(id) on delete cascade,
  pin_hash text not null unique check (length(pin_hash) = 64),
  created_at timestamptz not null default now()
);

alter table public.staff_checkin_pins enable row level security;
revoke all on public.staff_checkin_pins from public, anon, authenticated;
grant select, insert, update, delete on public.staff_checkin_pins to service_role;
