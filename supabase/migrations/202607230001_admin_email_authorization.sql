create or replace function public.is_daily_red_sea_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'info@dailyredsea.com';
$$;

revoke all on function public.is_daily_red_sea_admin() from public;
revoke all on function public.is_daily_red_sea_admin() from anon;
grant execute on function public.is_daily_red_sea_admin() to authenticated;

drop policy if exists "Authenticated admins manage bookings" on public.bookings;
drop policy if exists "Authenticated admins manage expenses" on public.expenses;
drop policy if exists "Authorized admin manages bookings" on public.bookings;
drop policy if exists "Authorized admin manages expenses" on public.expenses;

create policy "Authorized admin manages bookings"
on public.bookings for all to authenticated
using (public.is_daily_red_sea_admin())
with check (public.is_daily_red_sea_admin());

create policy "Authorized admin manages expenses"
on public.expenses for all to authenticated
using (public.is_daily_red_sea_admin())
with check (public.is_daily_red_sea_admin());
