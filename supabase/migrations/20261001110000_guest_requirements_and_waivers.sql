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
  created_at timestamptz not null default now()
);

create index if not exists booking_waivers_booking_idx on public.booking_waivers (booking_id, signed_at);

alter table public.booking_waivers enable row level security;

drop policy if exists "Booking staff read waivers" on public.booking_waivers;
create policy "Booking staff read waivers" on public.booking_waivers
  for select to authenticated
  using (public.admin_has_permission('view_bookings') or public.admin_has_permission('bookings'));

revoke all on public.booking_waivers from public, anon, authenticated;
grant select on public.booking_waivers to authenticated;
grant select, insert on public.booking_waivers to service_role;
