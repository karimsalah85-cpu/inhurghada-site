alter table public.bookings
  add column if not exists archived_at timestamptz;

alter table public.booking_submission_idempotency
  drop constraint if exists booking_submission_idempotency_booking_id_fkey,
  add constraint booking_submission_idempotency_booking_id_fkey
    foreign key (booking_id) references public.bookings(id) on delete cascade;

create index if not exists bookings_active_date_idx
  on public.bookings (date, created_at desc)
  where archived_at is null;

create or replace view public.admin_customer_summary with (security_invoker=true) as
select coalesce(nullif(lower(customer_email),''),phone) customer_key, max(customer_name) customer_name,
  max(customer_email) customer_email, max(phone) phone, count(*) bookings,
  count(*) filter (where status <> 'cancelled') completed_or_active_bookings,
  coalesce(sum(amount) filter (where payment_status='paid'),0) total_spending,
  max(currency) currency, min(created_at) first_booking_at, max(created_at) last_booking_at
from public.bookings
where archived_at is null
group by coalesce(nullif(lower(customer_email),''),phone);

grant select on public.admin_customer_summary to authenticated;

comment on column public.bookings.archived_at is
  'Reversible admin archive marker. Archived bookings are excluded from operational views and automation.';
