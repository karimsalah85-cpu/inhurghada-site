-- Per-vehicle airport transfer bookings carry more structured data than the
-- shared bookings columns model (route/zone, passenger split, luggage, oversized
-- items, child seats, allocated vehicles, pricing snapshot + pricing version).
--
-- This migration is additive and backwards-compatible: it adds a nullable JSONB
-- column. Existing rows and the current reserve_booking / reserve_booking_idempotent
-- RPCs are untouched. Until the RPC is extended, the human-readable transfer
-- snapshot continues to be written into bookings.notes by the booking API (the
-- same convention multi-trip bookings already use).
--
-- Follow-up (separate migration): extend reserve_booking + reserve_booking_idempotent
-- with `p_transfer_details jsonb default null` and persist it here, then surface it
-- in the admin booking detail panel.

alter table public.bookings
  add column if not exists transfer_details jsonb;

comment on column public.bookings.transfer_details is
  'Structured snapshot for per-vehicle airport transfers: route, zone, passenger split, luggage, oversized items, child seats, allocated vehicles, fare and pricing version. Nullable; populated for transfer bookings once the reserve RPC is extended.';
