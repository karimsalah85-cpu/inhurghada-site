-- The Orange Bay price ($30.72) does not include the Giftun national park fee
-- (about $5 per person, paid in cash on the day). Say so on the page so the
-- price in ads and on the site is not a surprise at the boat.
update public.content_items
set body = jsonb_set(
      body,
      '{notIncluded}',
      '["National park fee (about $5 per person, paid in cash on the day)"]'::jsonb || coalesce(body->'notIncluded', '[]'::jsonb)
    ),
    updated_at = now()
where content_type = 'tour'
  and slug = 'orange-bay'
  and not coalesce(body->'notIncluded', '[]'::jsonb)::text ilike '%park fee%';
