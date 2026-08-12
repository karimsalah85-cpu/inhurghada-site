\set ON_ERROR_STOP on
begin;

create function pg_temp.assert_true(condition boolean, message text)
returns void language plpgsql as $$
begin
  if not coalesce(condition, false) then raise exception 'ASSERTION FAILED: %', message; end if;
end $$;

insert into public.media_assets
  (id, storage_path, public_url, file_name, mime_type, alt_text, rights_status, authenticity)
values
  ('10000000-0000-0000-0000-000000000001', 'synthetic/used.webp', '/synthetic/used.webp', 'used.webp', 'image/webp', 'Legacy alt', 'owned', 'daily-red-sea'),
  ('10000000-0000-0000-0000-000000000002', 'synthetic/unused.webp', '/synthetic/unused.webp', 'unused.webp', 'image/webp', 'Unused', 'owned', 'daily-red-sea');

insert into public.media_asset_localizations(asset_id, locale, alt_text)
values ('10000000-0000-0000-0000-000000000001', 'en', 'Original English');
insert into public.media_usages(asset_id, owner_type, owner_key, role, sort_order)
values ('10000000-0000-0000-0000-000000000001', 'tour', 'synthetic-tour', 'featured', 0);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000001","email":"not-admin@example.test","role":"authenticated"}', true);
do $$ begin
  perform public.update_media_asset_atomic('10000000-0000-0000-0000-000000000001', '{}'::jsonb, null, null);
  raise exception 'unauthorized media update unexpectedly succeeded';
exception when insufficient_privilege then null; end $$;

select set_config('request.jwt.claims', '{"email":"info@dailyredsea.com","role":"authenticated"}', true);
do $$ begin
  perform public.update_media_asset_atomic('10000000-0000-0000-0000-000000000001', '{"focal_x":1.1}'::jsonb, null, null);
  raise exception 'invalid focal point unexpectedly succeeded';
exception when others then if sqlerrm = 'invalid focal point unexpectedly succeeded' then raise; end if; end $$;
do $$ begin
  perform public.update_media_asset_atomic('10000000-0000-0000-0000-000000000001', '{}'::jsonb,
    '[{"locale":"fr","alt_text":"bad"}]'::jsonb, null);
  raise exception 'unsupported locale unexpectedly succeeded';
exception when others then if sqlerrm = 'unsupported locale unexpectedly succeeded' then raise; end if; end $$;
do $$ begin
  perform public.update_media_asset_atomic('10000000-0000-0000-0000-000000000001', '{}'::jsonb,
    '[{"locale":"en"},{"locale":"en"}]'::jsonb, null);
  raise exception 'duplicate locale unexpectedly succeeded';
exception when others then if sqlerrm = 'duplicate locale unexpectedly succeeded' then raise; end if; end $$;
do $$ begin
  perform public.update_media_asset_atomic('10000000-0000-0000-0000-000000000001', '{}'::jsonb, null,
    '[{"owner_type":"tour","owner_key":"x","role":"invalid","sort_order":0}]'::jsonb);
  raise exception 'invalid role unexpectedly succeeded';
exception when others then if sqlerrm = 'invalid role unexpectedly succeeded' then raise; end if; end $$;
do $$ begin
  perform public.update_media_asset_atomic('10000000-0000-0000-0000-000000000001', '{}'::jsonb, null,
    '[{"owner_type":"tour","owner_key":"x","role":"gallery","sort_order":-1}]'::jsonb);
  raise exception 'negative order unexpectedly succeeded';
exception when others then if sqlerrm = 'negative order unexpectedly succeeded' then raise; end if; end $$;
do $$ begin
  perform public.update_media_asset_atomic('10000000-0000-0000-0000-000000000001', '{}'::jsonb, null,
    '[{"owner_type":"tour","owner_key":"x","role":"gallery","sort_order":0},{"owner_type":"tour","owner_key":"x","role":"gallery","sort_order":1}]'::jsonb);
  raise exception 'duplicate usage unexpectedly succeeded';
exception when others then if sqlerrm = 'duplicate usage unexpectedly succeeded' then raise; end if; end $$;
select public.update_media_asset_atomic(
  '10000000-0000-0000-0000-000000000001',
  '{"alt_text":"Atomic alt","focal_x":0.25,"focal_y":0.75,"rights_status":"owned"}'::jsonb,
  '[{"locale":"en","alt_text":"English alt"},{"locale":"ar","alt_text":"وصف تجريبي"}]'::jsonb,
  '[{"owner_type":"tour","owner_key":"synthetic-tour","role":"featured","sort_order":0},{"owner_type":"tour","owner_key":"synthetic-tour","role":"gallery","sort_order":1}]'::jsonb
);
select pg_temp.assert_true((select alt_text='Atomic alt' and focal_x=0.25 and focal_y=0.75 from public.media_assets where id='10000000-0000-0000-0000-000000000001'), 'atomic asset fields');
select pg_temp.assert_true((select count(*)=2 from public.media_asset_localizations where asset_id='10000000-0000-0000-0000-000000000001'), 'localizations replaced');
select pg_temp.assert_true((select count(*)=2 from public.media_usages where asset_id='10000000-0000-0000-0000-000000000001'), 'usages replaced');

select public.update_media_asset_atomic('10000000-0000-0000-0000-000000000001', '{"creator":"Synthetic creator"}', null, null);
select pg_temp.assert_true((select count(*)=2 from public.media_asset_localizations where asset_id='10000000-0000-0000-0000-000000000001'), 'omitted localizations preserved');
select pg_temp.assert_true((select count(*)=2 from public.media_usages where asset_id='10000000-0000-0000-0000-000000000001'), 'omitted usages preserved');

do $$ begin
  perform public.update_media_asset_atomic(
    '10000000-0000-0000-0000-000000000001', '{"alt_text":"must rollback"}',
    '[{"locale":"en","alt_text":"must rollback"}]'::jsonb,
    '[{"owner_type":"invalid","owner_key":"x","role":"featured","sort_order":0}]'::jsonb
  );
  raise exception 'invalid media usage unexpectedly succeeded';
exception when others then
  if sqlerrm = 'invalid media usage unexpectedly succeeded' then raise; end if;
end $$;
select pg_temp.assert_true((select alt_text='Atomic alt' from public.media_assets where id='10000000-0000-0000-0000-000000000001'), 'failed atomic save rolled back asset');
select pg_temp.assert_true((select count(*)=2 from public.media_asset_localizations where asset_id='10000000-0000-0000-0000-000000000001'), 'failed atomic save preserved localizations');

select public.update_media_asset_atomic('10000000-0000-0000-0000-000000000001', '{}'::jsonb, '[]'::jsonb, '[]'::jsonb);
select pg_temp.assert_true((select count(*)=0 from public.media_asset_localizations where asset_id='10000000-0000-0000-0000-000000000001'), 'empty localizations clear collection');
select pg_temp.assert_true((select count(*)=0 from public.media_usages where asset_id='10000000-0000-0000-0000-000000000001'), 'empty usages clear collection');

select public.update_media_asset_atomic('10000000-0000-0000-0000-000000000001', '{}'::jsonb, null,
  '[{"owner_type":"tour","owner_key":"synthetic-tour","role":"featured","sort_order":0}]'::jsonb);
do $$ begin
  delete from public.media_assets where id='10000000-0000-0000-0000-000000000001';
  raise exception 'referenced media deletion unexpectedly succeeded';
exception when foreign_key_violation then null; end $$;
delete from public.media_assets where id='10000000-0000-0000-0000-000000000002';
select pg_temp.assert_true(not exists(select 1 from public.media_assets where id='10000000-0000-0000-0000-000000000002'), 'unused media deletion succeeds');

select public.record_admin_audit('update','media','10000000-0000-0000-0000-000000000001','Synthetic integration audit');
reset role;
select pg_temp.assert_true(exists(select 1 from public.admin_audit_log where resource_id='10000000-0000-0000-0000-000000000001'), 'audit record written');

insert into public.tour_availability(id,tour_slug,service_date,start_time,capacity,reserved)
values ('30000000-0000-0000-0000-000000000001','synthetic-tour','2099-01-02','09:00',3,0);
-- Assertions below inspect durable state while exercising RPCs as service_role.
-- These transaction-local test grants roll back with the synthetic fixtures.
grant select on public.tour_availability, public.bookings,
  public.booking_submission_idempotency, public.booking_notification_deliveries
to service_role;
set local role service_role;

select public.reserve_booking_idempotent(
  '40000000-0000-0000-0000-000000000001', repeat('a',64), 'DRS-SYNTHETIC-1',
  'tour','Synthetic Customer','synthetic@example.test','+20000000000','Synthetic Tour','synthetic-tour',
  '2099-01-02','09:00',2,2,0,0,'Synthetic Hotel',null,100,'USD','en',null
);
select pg_temp.assert_true((select reserved=2 from public.tour_availability where id='30000000-0000-0000-0000-000000000001'), 'first booking reserves capacity');
select pg_temp.assert_true((select count(*)=3 from public.booking_notification_deliveries where booking_id=(select booking_id from public.booking_submission_idempotency where idempotency_key='40000000-0000-0000-0000-000000000001')), 'one notification outbox set');

select pg_temp.assert_true((public.reserve_booking_idempotent(
  '40000000-0000-0000-0000-000000000001', repeat('a',64), 'DRS-IGNORED-RETRY',
  'tour','Synthetic Customer','synthetic@example.test','+20000000000','Synthetic Tour','synthetic-tour',
  '2099-01-02','09:00',2,2,0,0,'Synthetic Hotel',null,100,'USD','en',null
)->>'replayed')::boolean, 'retry returns replay');
select pg_temp.assert_true((select count(*)=1 from public.bookings where reference like 'DRS-SYNTHETIC%'), 'retry creates no duplicate booking');
select pg_temp.assert_true((select reserved=2 from public.tour_availability where id='30000000-0000-0000-0000-000000000001'), 'retry reserves no duplicate capacity');

do $$ begin
  perform public.reserve_booking_idempotent(
    '40000000-0000-0000-0000-000000000001', repeat('b',64), 'DRS-CHANGED',
    'tour','Changed Customer','changed@example.test','+20111111111','Synthetic Tour','synthetic-tour',
    '2099-01-02','09:00',1,1,0,0,null,null,50,'USD','en',null);
  raise exception 'changed idempotency payload unexpectedly succeeded';
exception when invalid_parameter_value then null; end $$;

do $$ begin
  perform public.reserve_booking_idempotent(
    '40000000-0000-0000-0000-000000000002', repeat('c',64), 'DRS-CAPACITY-FAIL',
    'tour','Second Customer','second@example.test','+20222222222','Synthetic Tour','synthetic-tour',
    '2099-01-02','09:00',2,2,0,0,null,null,50,'USD','en',null);
  raise exception 'capacity conflict unexpectedly succeeded';
exception when raise_exception then
  if sqlerrm = 'capacity conflict unexpectedly succeeded' then raise; end if;
end $$;
select pg_temp.assert_true(not exists(select 1 from public.booking_submission_idempotency where idempotency_key='40000000-0000-0000-0000-000000000002'), 'failed reservation rolls back ledger');
select pg_temp.assert_true((select reserved=2 from public.tour_availability where id='30000000-0000-0000-0000-000000000001'), 'failed reservation rolls back capacity');

select pg_temp.assert_true(public.claim_booking_notification((select booking_id from public.booking_submission_idempotency where idempotency_key='40000000-0000-0000-0000-000000000001'),'operator_email'), 'notification claimed once');
select pg_temp.assert_true(not public.claim_booking_notification((select booking_id from public.booking_submission_idempotency where idempotency_key='40000000-0000-0000-0000-000000000001'),'operator_email'), 'notification cannot be claimed concurrently');
select public.finish_booking_notification((select booking_id from public.booking_submission_idempotency where idempotency_key='40000000-0000-0000-0000-000000000001'),'operator_email',true,null);
select pg_temp.assert_true((select state='sent' and attempts=1 from public.booking_notification_deliveries where booking_id=(select booking_id from public.booking_submission_idempotency where idempotency_key='40000000-0000-0000-0000-000000000001') and notification_kind='operator_email'), 'notification completion durable');

rollback;
\echo 'database_integration: PASS'
