alter table public.content_items
  add column if not exists listing_status text not null default 'active';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'content_items_listing_status_check'
  ) then
    alter table public.content_items
      add constraint content_items_listing_status_check
      check (listing_status in ('active', 'paused', 'unlisted'));
  end if;
end
$$;

create index if not exists content_items_tour_listing_idx
  on public.content_items (content_type, locale, listing_status)
  where content_type = 'tour';

comment on column public.content_items.listing_status is
  'Trip commercial visibility: active is visible/bookable, paused is visible/not bookable, unlisted is hidden/not bookable.';
