-- Guest requirements and diving waivers. Additive only.
--
-- 1. bookings.guest_requirements: operational needs the crew must know
--    (non-swimmers, medical notes, dietary needs, diving certification). Shape
--    is validated in lib/guest-requirements.ts; the check below only guarantees
--    it is a JSON object. Written by admins through
--    PATCH /api/admin/bookings/<id>/requirements (existing bookings policies).
--
-- 2. booking_waivers: one signed liability waiver + medical statement per
--    diver (adults + youth) for bookings of "Diving" tours. Guests sign on
--    /waiver/<signed token>; the public submit route verifies the HMAC token
--    and inserts with the service role, so anon/authenticated get no write
--    access at all. Admins with booking access can read them.
--    The signer's IP is never stored — only an HMAC-SHA256 of it keyed with a
--    server secret (ip_hash), enough to spot abuse without keeping the address.
--    waiver_version ties every row to the exact wording in lib/waiver-content.ts.

alter table public.bookings
  add column if not exists guest_requirements jsonb not null default '{}'::jsonb;

do $$ begin
  alter table public.bookings
    add constraint bookings_guest_requirements_object check (jsonb_typeof(guest_requirements) = 'object');
exception when duplicate_object then null;
end $$;

create table if not exists public.booking_waivers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  participant_name text not null check (length(participant_name) between 2 and 120),
  date_of_birth date,
  certification text check (certification is null
    or certification in ('none', 'open_water', 'advanced', 'rescue', 'divemaster_plus')),
  -- { "answers": { "<question id>": "yes" | "no", ... }, "flagged": bool, "photo_consent": bool }
  medical_declaration jsonb not null default '{}'::jsonb check (jsonb_typeof(medical_declaration) = 'object'),
  medical_flagged boolean generated always as (coalesce((medical_declaration->>'flagged')::boolean, false)) stored,
  accepted boolean not null check (accepted),
  signature_name text not null check (length(signature_name) between 2 and 120),
  signed_at timestamptz not null default now(),
  ip_hash text check (ip_hash is null or ip_hash ~ '^[0-9a-f]{64}$'),
  user_agent text check (user_agent is null or length(user_agent) <= 400),
  waiver_version text not null check (length(waiver_version) between 1 and 40),
  -- An admin can void a junk or mistaken signature (e.g. a forwarded link filled
  -- with a wrong name) so the slot frees up; the row is kept for the record.
  voided_at timestamptz,
  voided_by text check (voided_by is null or length(voided_by) <= 200),
  void_reason text check (void_reason is null or length(void_reason) <= 300),
  created_at timestamptz not null default now()
);

create index if not exists booking_waivers_booking_idx on public.booking_waivers (booking_id, signed_at);
-- One live signature per participant name per booking.
create unique index if not exists booking_waivers_one_per_name
  on public.booking_waivers (booking_id, lower(participant_name))
  where voided_at is null;

alter table public.booking_waivers enable row level security;

drop policy if exists "Booking staff read waivers" on public.booking_waivers;
create policy "Booking staff read waivers" on public.booking_waivers
  for select to authenticated
  using (public.admin_has_permission('view_bookings') or public.admin_has_permission('bookings'));

revoke all on public.booking_waivers from public, anon, authenticated;
grant select on public.booking_waivers to authenticated;
grant select, insert on public.booking_waivers to service_role;

-- Booking staff may void a signature (only these three columns).
grant update (voided_at, voided_by, void_reason) on public.booking_waivers to authenticated;
drop policy if exists "Booking staff void waivers" on public.booking_waivers;
create policy "Booking staff void waivers" on public.booking_waivers
  for update to authenticated
  using (public.admin_has_permission('edit_bookings') or public.admin_has_permission('bookings'))
  with check (public.admin_has_permission('edit_bookings') or public.admin_has_permission('bookings'));

-- Public signatures go through this function so the "how many are still
-- needed" check and the insert happen under a lock on the booking: two people
-- signing at the same moment cannot exceed the number of divers.
create or replace function public.submit_booking_waiver(
  p_booking_id uuid, p_needed integer, p_participant_name text, p_date_of_birth date,
  p_certification text, p_medical_declaration jsonb, p_signature_name text,
  p_ip_hash text, p_user_agent text, p_waiver_version text
) returns text
language plpgsql security definer set search_path = '' as $$
declare live_count integer;
begin
  perform 1 from public.bookings where id = p_booking_id for update;
  if not found then return 'missing'; end if;
  if exists (select 1 from public.booking_waivers where booking_id = p_booking_id and voided_at is null and lower(participant_name) = lower(p_participant_name)) then
    return 'already';
  end if;
  select count(*) into live_count from public.booking_waivers where booking_id = p_booking_id and voided_at is null;
  if live_count >= greatest(p_needed, 1) then return 'complete'; end if;
  insert into public.booking_waivers (booking_id, participant_name, date_of_birth, certification, medical_declaration, accepted, signature_name, ip_hash, user_agent, waiver_version)
  values (p_booking_id, p_participant_name, p_date_of_birth, p_certification, p_medical_declaration, true, p_signature_name, p_ip_hash, p_user_agent, p_waiver_version);
  return 'signed';
exception when unique_violation then
  return 'already';
end $$;

revoke all on function public.submit_booking_waiver(uuid, integer, text, date, text, jsonb, text, text, text, text) from public, anon, authenticated;
grant execute on function public.submit_booking_waiver(uuid, integer, text, date, text, jsonb, text, text, text, text) to service_role;
