-- Fix for phase 5: the VAT report view runs as the signed-in user and calls
-- these two country lookups, so signed-in finance staff must be able to run
-- them. They only read tax_jurisdictions, which row-level security limits to
-- finance staff.
grant execute on function public.finance_trip_country(text) to authenticated;
grant execute on function public.finance_home_country() to authenticated;
