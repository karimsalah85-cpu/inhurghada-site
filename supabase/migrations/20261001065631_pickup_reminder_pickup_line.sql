-- Pickup reminders now show the assigned pickup time when one is known.
-- Only rewrites the two seeded English templates if they still carry the
-- original seed wording, so any edits made in the admin are left alone.
update public.communication_templates
set body = replace(body, 'We will confirm the pickup time for {{hotel}} by WhatsApp.', '{{pickup_line}}'),
    updated_at = now()
where event_key = 'pickup_reminder' and channel = 'email' and locale = 'en'
  and body like '%We will confirm the pickup time for {{hotel}} by WhatsApp.%';

update public.communication_templates
set body = replace(body, 'We will confirm your pickup at {{hotel}}.', '{{pickup_line}}'),
    updated_at = now()
where event_key = 'pickup_reminder' and channel = 'whatsapp' and locale = 'en'
  and body like '%We will confirm your pickup at {{hotel}}.%';
