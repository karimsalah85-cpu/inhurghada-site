-- Per-trip customer reviews. Reviews are tied to a specific completed booking
-- (one review per booking, on the tour actually taken) and held for admin
-- moderation before they are shown publicly.
create type public.review_status as enum ('pending', 'approved', 'rejected');

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  tour_slug text not null,
  customer_name text not null,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 1 and 2000),
  status public.review_status not null default 'pending',
  moderated_by uuid references auth.users(id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reviews_tour_slug_status_idx on public.reviews (tour_slug, status);
create index reviews_status_idx on public.reviews (status);

alter table public.reviews enable row level security;

create policy "Authorized admin manages reviews" on public.reviews for all to authenticated
  using (public.is_daily_red_sea_admin()) with check (public.is_daily_red_sea_admin());

revoke all on public.reviews from public, anon, authenticated;
grant select, update on public.reviews to authenticated;

-- Verifies the booking is real, belongs to the requesting customer, is
-- completed, and hasn't already been reviewed, then stores the review as
-- pending. Multi-trip bookings ('multi-trip') aren't reviewable since they
-- don't identify a single tour.
create or replace function public.submit_trip_review(
  p_reference text, p_customer_email text, p_rating smallint, p_body text
)
returns public.reviews
language plpgsql
security definer
set search_path = ''
as $$
declare
  matched public.bookings;
  created public.reviews;
  trimmed_body text := btrim(coalesce(p_body, ''));
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception using errcode = '22023', message = 'Rating must be between 1 and 5.';
  end if;
  if trimmed_body = '' or char_length(trimmed_body) > 2000 then
    raise exception using errcode = '22023', message = 'Review text is required (up to 2000 characters).';
  end if;

  select * into matched from public.bookings
  where reference = btrim(coalesce(p_reference, ''))
    and lower(customer_email) = lower(btrim(coalesce(p_customer_email, '')))
  limit 1;

  if not found then
    raise exception using errcode = 'P0002', message = 'We could not find a booking matching that reference and email.';
  end if;
  if matched.status <> 'completed' then
    raise exception using errcode = 'P0001', message = 'Reviews can only be submitted once your trip is marked completed.';
  end if;
  if matched.tour_slug is null or matched.tour_slug = '' or matched.tour_slug = 'multi-trip' then
    raise exception using errcode = 'P0001', message = 'This booking cannot be reviewed.';
  end if;
  if exists (select 1 from public.reviews where booking_id = matched.id) then
    raise exception using errcode = '23505', message = 'A review has already been submitted for this booking.';
  end if;

  insert into public.reviews (booking_id, tour_slug, customer_name, rating, body, status)
  values (matched.id, matched.tour_slug, matched.customer_name, p_rating, trimmed_body, 'pending')
  returning * into created;

  return created;
end;
$$;

revoke all on function public.submit_trip_review(text, text, smallint, text) from public, anon, authenticated;
grant execute on function public.submit_trip_review(text, text, smallint, text) to service_role;
