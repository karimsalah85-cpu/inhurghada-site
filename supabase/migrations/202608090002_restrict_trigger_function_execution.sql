-- Trigger functions execute through their triggers and must not be callable through the Data API.
revoke execute on function public.release_booking_capacity() from public, anon, authenticated;
