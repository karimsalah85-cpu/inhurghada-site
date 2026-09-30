-- Supplier booking requests: the admin sends a booking's details to a supplier
-- (boat, driver, guide, hotel ...) by WhatsApp and/or email. The message
-- carries a signed link (see lib/supplier-request-token.ts) to
-- /supplier/<token>, where the supplier confirms, declines or asks for a
-- change, and later confirms they received their payment.
--
-- `details` is a snapshot of exactly what was shared with the supplier, so the
-- admin can always see what the supplier saw. The guest's email address is
-- never part of it.
--
-- Both tables are server-only: admin routes check the live permission and then
-- write with the service role; the public supplier page reads via the service
-- role after verifying the signed token.
create table if not exists public.supplier_booking_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  status text not null default 'sent'
    check (status in ('sent', 'confirmed', 'declined', 'change_requested', 'cancelled')),
  details jsonb not null,
  admin_note text check (admin_note is null or length(admin_note) <= 1000),
  supplier_note text check (supplier_note is null or length(supplier_note) <= 1000),
  amount_due numeric(14,2) check (amount_due is null or amount_due >= 0),
  amount_due_currency text check (amount_due_currency is null or amount_due_currency ~ '^[A-Z]{3}$'),
  check ((amount_due is null) = (amount_due_currency is null)),
  sent_at timestamptz not null default now(),
  last_sent_at timestamptz not null default now(),
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  responded_at timestamptz,
  responded_by text check (responded_by is null or length(responded_by) <= 120),
  payment_status text not null default 'none'
    check (payment_status in ('none', 'sent', 'received', 'disputed')),
  payment_amount numeric(14,2) check (payment_amount is null or payment_amount > 0),
  payment_currency text check (payment_currency is null or payment_currency ~ '^[A-Z]{3}$'),
  payment_method text check (payment_method is null
    or payment_method in ('cash', 'bank_transfer', 'instapay', 'vodafone_cash', 'other')),
  payment_reference text check (payment_reference is null or length(payment_reference) <= 200),
  payment_note text check (payment_note is null or length(payment_note) <= 1000),
  payment_sent_at timestamptz,
  payment_confirmed_at timestamptz,
  check (payment_status = 'none' or (payment_amount is not null and payment_currency is not null and payment_sent_at is not null)),
  created_by uuid references auth.users(id) on delete set null,
  created_by_email text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists supplier_booking_requests_booking_idx on public.supplier_booking_requests (booking_id, created_at desc);
create index if not exists supplier_booking_requests_supplier_idx on public.supplier_booking_requests (supplier_id, created_at desc);
create index if not exists supplier_booking_requests_open_idx on public.supplier_booking_requests (status, last_sent_at)
  where status in ('sent', 'change_requested');
-- Only one live request per supplier per booking; cancelled/declined ones stay as history.
create unique index if not exists supplier_booking_requests_live_unique on public.supplier_booking_requests (booking_id, supplier_id)
  where status in ('sent', 'confirmed', 'change_requested');

-- Append-only timeline: every send, view, response and payment step.
create table if not exists public.supplier_booking_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.supplier_booking_requests(id) on delete cascade,
  event_type text not null check (event_type in (
    'sent', 'resent', 'viewed', 'confirmed', 'declined', 'change_requested', 'cancelled',
    'manual_confirmed', 'manual_declined', 'payment_sent', 'payment_received', 'payment_disputed', 'delivery_failed'
  )),
  actor text not null check (length(actor) between 1 and 320),
  note text check (note is null or length(note) <= 1000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists supplier_booking_request_events_request_idx on public.supplier_booking_request_events (request_id, created_at);

alter table public.supplier_booking_requests enable row level security;
alter table public.supplier_booking_request_events enable row level security;
revoke all on public.supplier_booking_requests from public, anon, authenticated;
revoke all on public.supplier_booking_request_events from public, anon, authenticated;
grant select, insert, update on public.supplier_booking_requests to service_role;
grant select, insert on public.supplier_booking_request_events to service_role;
