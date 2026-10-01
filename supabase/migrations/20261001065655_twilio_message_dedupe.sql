-- The Twilio inbound webhook now returns 500 when a save fails, so Twilio
-- retries. A retry after a save that succeeded but timed out would store the
-- same message twice; this index makes the retry a no-op (the route treats
-- 23505 as success).
create unique index if not exists communication_messages_provider_message_unique
  on public.communication_messages (provider_message_id)
  where provider_message_id is not null;
