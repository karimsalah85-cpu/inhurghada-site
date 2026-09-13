-- A human-facing identifier belongs to the canonical English trip, across locales.
alter table public.content_items add column if not exists trip_id text;
alter table public.content_items add constraint content_items_trip_id_format
  check (trip_id is null or (content_type = 'tour' and locale = 'en' and trip_id ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'));
create unique index content_items_trip_id_unique on public.content_items (trip_id) where trip_id is not null;
comment on column public.content_items.trip_id is 'Admin-assigned public trip reference; independent of the URL slug and row UUID.';
