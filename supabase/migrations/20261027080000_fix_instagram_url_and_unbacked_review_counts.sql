-- Point the footer/social Instagram link at the real account (@dailyredsea).
update public.site_settings
set value = '"https://www.instagram.com/dailyredsea/"'::jsonb
where key = 'instagram_url'
  and value = '"https://www.instagram.com/dailyredsea.com7/"'::jsonb;

-- Orange Bay (5.0 / 30) and the underwater photographer (5.0 / 12) showed seed
-- review counts with no approved guest reviews behind them, while the same page
-- said "No guest reviews for this trip yet". Show them as new until real
-- approved reviews exist (the live review badge takes over automatically).
update public.content_items
set body = body || '{"rating":"New","reviews":"New"}'::jsonb,
    updated_at = now()
where content_type = 'tour'
  and slug in ('orange-bay', 'professional-underwater-photographer')
  and body->>'reviews' in ('30', '12');
