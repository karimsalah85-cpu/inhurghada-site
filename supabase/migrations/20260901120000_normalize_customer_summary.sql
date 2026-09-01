-- Fix admin_customer_summary silently double-counting the same real customer when their
-- phone number is recorded with different formatting across bookings (e.g. "+20 103 080 9150"
-- vs "01030809150" vs "0020103...") — the identity key previously grouped on the raw phone
-- string. Also trims stray whitespace around the email before grouping.
create or replace view public.admin_customer_summary with (security_invoker=true) as
select
  coalesce(nullif(trim(lower(customer_email)), ''), nullif(regexp_replace(phone, '\D', '', 'g'), '')) customer_key,
  max(customer_name) customer_name,
  max(customer_email) customer_email,
  max(phone) phone,
  count(*) bookings,
  count(*) filter (where status <> 'cancelled') completed_or_active_bookings,
  coalesce(sum(amount) filter (where payment_status = 'paid'), 0) total_spending,
  max(currency) currency,
  min(created_at) first_booking_at,
  max(created_at) last_booking_at
from public.bookings
where archived_at is null
group by coalesce(nullif(trim(lower(customer_email)), ''), nullif(regexp_replace(phone, '\D', '', 'g'), ''));

grant select on public.admin_customer_summary to authenticated;
